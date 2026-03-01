import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  getAll(@Req() req) {
    return this.documentsService.getVisibleDocuments(req.user);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Req() req) {
    return this.documentsService.getDocumentById(id, req.user);
  }
}