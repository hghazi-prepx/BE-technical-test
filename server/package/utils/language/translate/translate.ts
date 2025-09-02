import { language } from '../language';

export class LanguageHandler {
  key: language;
  language: string;
  constructor({ key, language }: { key: language; language: string }) {
    this.key = key;
    this.language = language;
  }
  translate() {
    return this.key[this.language || 'ar'];
  }
}
