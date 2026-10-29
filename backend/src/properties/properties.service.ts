import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument } from './entities/property.entity';
import { PropertyImage, PropertyImageDocument } from './entities/property-image.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { buildUpdate } from '../common/build-update';
import { AuthUser, withOwner } from '../common/scope';

const MAX_IMAGES = 8;

// نتعرفو على نوع الصورة بالـmagic bytes (الـmimetype يبعتو الكلاينت وممكن يكذب)
function detectImageType(buf: Buffer): string | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.length > 12 && buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return null;
}

type UploadedImage = { buffer: Buffer; originalname: string };

@Injectable()
export class PropertiesService {
  constructor(
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
    @InjectModel(PropertyImage.name) private imageModel: Model<PropertyImageDocument>,
  ) {}

  async create(dto: CreatePropertyDto, user: AuthUser) {
    const property = await this.propertyModel.create(withOwner(dto, user));
    return property.populate('agent');
  }

  findAll() {
    return this.propertyModel.find().populate('agent').exec();
  }

  async findOne(id: string) {
    const property = await this.propertyModel.findById(id).populate('agent').exec();
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async update(id: string, dto: UpdatePropertyDto) {
    const property = await this.propertyModel
      .findByIdAndUpdate(id, buildUpdate(dto, ['district', 'area', 'bedrooms', 'bathrooms', 'description', 'agent']), { returnDocument: 'after' })
      .populate('agent')
      .exec();
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async remove(id: string) {
    const result = await this.propertyModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Property not found');
    await this.imageModel.deleteMany({ property: result._id }).exec();
    return { deleted: true };
  }

  // ───────── صور العقار ─────────

  async addImages(id: string, files?: UploadedImage[]) {
    if (!files || files.length === 0) throw new BadRequestException('At least one image is required');

    const property = await this.propertyModel.findById(id).select('images').exec();
    if (!property) throw new NotFoundException('Property not found');

    if ((property.images?.length || 0) + files.length > MAX_IMAGES) {
      throw new BadRequestException(`A property can have at most ${MAX_IMAGES} photos`);
    }

    // نتحققو من الكل قبل ما نخزّنو شي
    const checked = files.map(f => {
      const mime = detectImageType(f.buffer);
      if (!mime) throw new BadRequestException('Only JPEG, PNG or WebP images are allowed');
      return { f, mime };
    });

    const created = await this.imageModel.insertMany(
      checked.map(({ f, mime }) => ({
        property: property._id,
        data: f.buffer,
        mimeType: mime,
        name: Buffer.from(f.originalname || 'photo', 'latin1').toString('utf8').slice(0, 120),
        size: f.buffer.length,
      })),
    );

    return this.propertyModel
      .findByIdAndUpdate(id, { $push: { images: { $each: created.map(d => String(d._id)) } } }, { returnDocument: 'after' })
      .populate('agent')
      .exec();
  }

  async removeImage(id: string, imageId: string) {
    const property = await this.propertyModel.findById(id).select('images').exec();
    if (!property) throw new NotFoundException('Property not found');
    if (!property.images?.includes(imageId)) throw new NotFoundException('Image not found');

    await this.imageModel.deleteOne({ _id: imageId, property: property._id }).exec();
    return this.propertyModel
      .findByIdAndUpdate(id, { $pull: { images: imageId } }, { returnDocument: 'after' })
      .populate('agent')
      .exec();
  }

  async setCover(id: string, imageId: string) {
    const property = await this.propertyModel.findById(id).select('images').exec();
    if (!property) throw new NotFoundException('Property not found');
    if (!property.images?.includes(imageId)) throw new NotFoundException('Image not found');

    const reordered = [imageId, ...property.images.filter(x => x !== imageId)];
    return this.propertyModel
      .findByIdAndUpdate(id, { $set: { images: reordered } }, { returnDocument: 'after' })
      .populate('agent')
      .exec();
  }

  async getImage(imageId: string) {
    const img = await this.imageModel.findById(imageId).select('data mimeType').exec();
    if (!img) throw new NotFoundException('Image not found');
    return { data: img.data, mimeType: img.mimeType };
  }
}