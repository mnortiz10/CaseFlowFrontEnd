import { Pipe, PipeTransform } from '@angular/core';
import { parseApiDate } from '../../core/utils/api-date';

/**
 * Normalises an API timestamp into a real instant so `| date` renders it in the viewer's
 * timezone instead of echoing the raw UTC digits. Chain it before the date pipe:
 *
 *   {{ ticket.stateEnteredAt | apiDate | date:'dd/MM/yyyy HH:mm' }}
 *
 * Pure, so Angular memoises per input string and this costs nothing on re-render.
 */
@Pipe({ name: 'apiDate', standalone: true })
export class ApiDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): Date | null {
    return parseApiDate(value);
  }
}
