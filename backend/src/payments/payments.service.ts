import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Contract, ContractDocument } from '../contracts/entities/contract.entity';
import { buildUpdate } from '../common/build-update';
import { AuthUser, ownFilter } from '../common/scope';

const CONTRACT_POPULATE = {
  path: 'contract',
  populate: [{ path: 'client' }, { path: 'property' }],
};

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Contract.name) private contractModel: Model<ContractDocument>,
  ) {}

  // الدفعات ما فيهاش agent مباشرة: نربطوها بعقود الوكيل
  private async scopeFilter(user: AuthUser): Promise<Record<string, unknown>> {
    if (user.role === 'admin') return {};
    if (!user.agentId) return { _id: { $in: [] } };
    const ids = await this.contractModel.find(ownFilter(user)).distinct('_id');
    return { contract: { $in: ids } };
  }

  private async assertOwnsContract(contractId: unknown, user: AuthUser) {
    if (user.role === 'admin') return;
    const id = (contractId as { _id?: unknown } | null)?._id ?? contractId;
    const owned = await this.contractModel.exists({ _id: String(id), ...ownFilter(user) });
    if (!owned) throw new ForbiddenException('You can only manage payments of your own contracts');
  }

  // الدفعة تساهم في مبلغ العقد المدفوع (contract.paid) فقط إذا كانت Paid.
  // نستعملو الفرق (delta) باش ما نمسحوش المبلغ المدخل يدويا عند إنشاء العقد.
  private contribution(p?: { status?: string; amount?: number } | null) {
    return p && p.status === 'Paid' ? Number(p.amount) || 0 : 0;
  }

  private async adjustPaid(contractId: unknown, delta: number) {
    if (!delta || !contractId) return;
    const id = (contractId as any)?._id ?? contractId;
    // تحديث ذري، ومانخليوش paid يولي سالب
    await this.contractModel.updateOne(
      { _id: new Types.ObjectId(String(id)) },
      [{ $set: { paid: { $max: [0, { $add: [{ $ifNull: ['$paid', 0] }, delta] }] } } }],
      { updatePipeline: true },
    );
  }

  async create(dto: CreatePaymentDto, user: AuthUser) {
    await this.assertOwnsContract(dto.contract, user);
    const payment = await this.paymentModel.create(dto);
    await this.adjustPaid(payment.contract, this.contribution(payment));
    return payment.populate(CONTRACT_POPULATE);
  }

  async findAll(user: AuthUser) {
    return this.paymentModel.find(await this.scopeFilter(user)).populate(CONTRACT_POPULATE).exec();
  }

  async findOne(id: string, user: AuthUser) {
    const payment = await this.paymentModel.findOne({ _id: id, ...(await this.scopeFilter(user)) }).populate(CONTRACT_POPULATE).exec();
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async update(id: string, dto: UpdatePaymentDto, user: AuthUser) {
    const before = await this.paymentModel.findOne({ _id: id, ...(await this.scopeFilter(user)) }).lean().exec();
    if (!before) throw new NotFoundException('Payment not found');
    if (dto.contract) await this.assertOwnsContract(dto.contract, user);

    const payment = await this.paymentModel
      .findByIdAndUpdate(id, buildUpdate(dto, ['paidDate', 'method']), { returnDocument: 'after' })
      .exec();
    if (!payment) throw new NotFoundException('Payment not found');

    const oldC = this.contribution(before);
    const newC = this.contribution(payment);
    if (String(before.contract) === String(payment.contract)) {
      await this.adjustPaid(payment.contract, newC - oldC);
    } else {
      await this.adjustPaid(before.contract, -oldC);
      await this.adjustPaid(payment.contract, newC);
    }
    return payment.populate(CONTRACT_POPULATE);
  }

  async remove(id: string) {
    const result = await this.paymentModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Payment not found');
    await this.adjustPaid(result.contract, -this.contribution(result));
    return { deleted: true };
  }
}