import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Property, PropertySchema } from '../properties/entities/property.entity';
import { Client, ClientSchema } from '../clients/entities/client.entity';
import { Agent, AgentSchema } from '../agents/entities/agent.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Property.name, schema: PropertySchema },
      { name: Client.name, schema: ClientSchema },
      { name: Agent.name, schema: AgentSchema },
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
