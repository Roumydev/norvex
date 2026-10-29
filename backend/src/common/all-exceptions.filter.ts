import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';

// أخطاء واضحة بدل 500: id غالط => 400، قيمة مكررة => 409
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: any, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      return res
        .status(exception.getStatus())
        .json(typeof body === 'string' ? { statusCode: exception.getStatus(), message: body } : body);
    }
    if (exception?.name === 'CastError') {
      return res.status(400).json({ statusCode: 400, message: 'Invalid identifier or value format', error: 'Bad Request' });
    }
    if (exception?.name === 'ValidationError') {
      return res.status(400).json({ statusCode: 400, message: exception.message, error: 'Bad Request' });
    }
    if (exception?.code === 11000) {
      return res.status(409).json({ statusCode: 409, message: 'Duplicate value: this record already exists', error: 'Conflict' });
    }
    this.logger.error(exception?.stack || String(exception));
    return res.status(500).json({ statusCode: 500, message: 'Internal server error' });
  }
}