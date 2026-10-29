import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contract, ContractDocument } from './entities/contract.entity';
import { ContractFile, ContractFileDocument } from './entities/contract-file.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { buildUpdate } from '../common/build-update';
import { AuthUser, ownFilter, withOwner, withoutOwnerChange } from '../common/scope';

@Injectable()
export class ContractsService {
  constructor(
    @InjectModel(Contract.name) private contractModel: Model<ContractDocument>,
    @InjectModel(ContractFile.name) private fileModel: Model<ContractFileDocument>,
  ) {}

  create(dto: CreateContractDto, user: AuthUser) {
    return this.contractModel.create(withOwner(dto, user));
  }

  findAll(user: AuthUser) {
    return this.contractModel
      .find(ownFilter(user))
      .populate('property')
      .populate('client')
      .populate('agent')
      .exec();
  }

  async findOne(id: string, user: AuthUser) {
    const contract = await this.contractModel
      .findOne({ _id: id, ...ownFilter(user) })
      .populate('property')
      .populate('client')
      .populate('agent')
      .exec();
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async update(id: string, dto: UpdateContractDto, user: AuthUser) {
    const contract = await this.contractModel
      .findOneAndUpdate({ _id: id, ...ownFilter(user) }, buildUpdate(withoutOwnerChange(dto, user), ['startDate', 'endDate']), { returnDocument: 'after' })
      .populate('property')
      .populate('client')
      .populate('agent')
      .exec();
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async remove(id: string) {
    const result = await this.contractModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Contract not found');
    await this.fileModel.deleteOne({ contract: result._id }).exec();
    return { deleted: true };
  }

  // ───────── ملف PDF تاع العقد ─────────

  async setDocument(id: string, user: AuthUser, file?: { buffer: Buffer; originalname: string; mimetype: string; size: number }) {
    if (!file || !file.buffer?.length) throw new BadRequestException('PDF file is required');

    // نتحققو من النوع بالـmagic bytes (الـmimetype يبعتو الكلاينت وممكن يكذب)
    const isPdf = file.buffer.subarray(0, 5).toString('latin1') === '%PDF-';
    if (!isPdf) throw new BadRequestException('Only PDF files are allowed');

    const contract = await this.contractModel.findOne({ _id: id, ...ownFilter(user) }).select('_id').exec();
    if (!contract) throw new NotFoundException('Contract not found');

    // multer يقرا اسم الملف latin1، نرجعوه UTF-8 (للأسماء العربية)
    const name = Buffer.from(file.originalname || 'contract.pdf', 'latin1').toString('utf8').slice(0, 120);

    await this.fileModel
      .findOneAndUpdate(
        { contract: contract._id },
        { $set: { data: file.buffer, mimeType: 'application/pdf' } },
        { upsert: true },
      )
      .exec();

    return this.contractModel
      .findByIdAndUpdate(
        id,
        { $set: { documentName: name, documentSize: file.buffer.length, documentUploadedAt: new Date() } },
        { returnDocument: 'after' },
      )
      .populate('property')
      .populate('client')
      .populate('agent')
      .exec();
  }

  async getDocument(id: string, user: AuthUser) {
    const contract = await this.contractModel.findOne({ _id: id, ...ownFilter(user) }).select('documentName').exec();
    if (!contract) throw new NotFoundException('Contract not found');
    const file = await this.fileModel.findOne({ contract: contract._id }).exec();
    if (!file) throw new NotFoundException('This contract has no document');
    return { data: file.data, name: contract.documentName || 'contract.pdf' };
  }

  async removeDocument(id: string, user: AuthUser) {
    const contract = await this.contractModel.findOne({ _id: id, ...ownFilter(user) }).select('_id').exec();
    if (!contract) throw new NotFoundException('Contract not found');
    await this.fileModel.deleteOne({ contract: contract._id }).exec();
    return this.contractModel
      .findByIdAndUpdate(
        id,
        { $unset: { documentName: '', documentSize: '', documentUploadedAt: '' } },
        { returnDocument: 'after' },
      )
      .populate('property')
      .populate('client')
      .populate('agent')
      .exec();
  }
}