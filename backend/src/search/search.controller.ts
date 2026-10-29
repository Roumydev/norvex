import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUser } from '../common/scope';

@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // GET /search?q=hydra  (أي مستخدم مسجّل)
  @Get()
  search(@Query('q') q: string | undefined, @Req() req: { user: AuthUser }) {
    return this.searchService.search(q, req.user);
  }
}
