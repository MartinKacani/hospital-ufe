/* tslint:disable */
/* eslint-disable */

export interface Reservation {
  id: string;
  patientId: string;
  patientName: string;
  department: string;
  reason: string;
  from: Date;
  to: Date;
  contactInfo?: string;
  status: ReservationStatusEnum;
  cancelReason?: string;
  note?: string;
  roomOrAmbulance?: string;
}

export type ReservationStatusEnum = 'pending' | 'confirmed' | 'cancelled';

export function ReservationFromJSON(json: any): Reservation {
  return {
    id: json['id'],
    patientId: json['patientId'],
    patientName: json['patientName'],
    department: json['department'],
    reason: json['reason'],
    from: new Date(json['from']),
    to: new Date(json['to']),
    contactInfo: json['contactInfo'],
    status: json['status'],
    cancelReason: json['cancelReason'],
    note: json['note'],
    roomOrAmbulance: json['roomOrAmbulance'],
  };
}

export function ReservationToJSON(value?: Reservation | null): any {
  if (value === undefined || value === null) return undefined;
  return {
    id: value.id,
    patientId: value.patientId,
    patientName: value.patientName,
    department: value.department,
    reason: value.reason,
    from: value.from.toISOString(),
    to: value.to.toISOString(),
    contactInfo: value.contactInfo,
    status: value.status,
    cancelReason: value.cancelReason,
    note: value.note,
    roomOrAmbulance: value.roomOrAmbulance,
  };
}
