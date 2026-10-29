import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  // نقراو الدور وربط الوكيل من القاعدة في كل طلب:
  //  - حساب محذوف => التوكن يتوقف فورا
  //  - تغيير الدور أو الربط يتطبق مباشرة بلا ما يعاود يدخل
  async validate(payload: { sub: string }) {
    const user = await this.usersService.findForAuth(payload.sub);
    if (!user) throw new UnauthorizedException();
    return {
      userId: String(user._id),
      email: user.email,
      role: user.role,
      agentId: user.agent ? String(user.agent) : null,
    };
  }
}
