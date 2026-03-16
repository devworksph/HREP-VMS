import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root' // automatically available app-wide
})
export class StringHelper {
    public toTitleCase(text: string): string {
        return text
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());
    }
}