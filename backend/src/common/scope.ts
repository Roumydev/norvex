import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';

// المستخدم الحالي كما يرجّعو JwtStrategy
export interface AuthUser {
  userId: string;
  email: string;
  role: string;
  agentId?: string | null; // ملف الوكيل المربوط بحساب الدخول
}

// فلتر الملكية: الـadmin يشوف كلش، الوكيل يشوف فقط سجلاته (agent = هو).
// وكيل غير مربوط بملف وكيل => ما يشوف والو.
export function ownFilter(user: AuthUser): Record<string, unknown> {
  if (user.role === 'admin') return {};
  if (!user.agentId) return { _id: { $in: [] } };
  return { agent: new Types.ObjectId(user.agentId) };
}

// عند الإنشاء: السجل يتسند للوكيل نفسو (ما يقدرش يسندو لوكيل آخر)
export function withOwner<T extends object>(dto: T, user: AuthUser): T {
  if (user.role === 'admin') return dto;
  if (!user.agentId) throw new ForbiddenException('Your account is not linked to an agent profile yet');
  return { ...dto, agent: user.agentId };
}

// عند التعديل: الوكيل ما يغيّرش الوكيل المسؤول
export function withoutOwnerChange<T extends object>(dto: T, user: AuthUser): T {
  if (user.role === 'admin') return dto;
  const { agent: _ignored, ...rest } = dto as T & { agent?: unknown };
  void _ignored;
  return rest as T;
}
