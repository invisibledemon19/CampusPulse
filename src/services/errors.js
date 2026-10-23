export class ServiceError extends Error {
  constructor(code, message, fieldErrors = null) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}
