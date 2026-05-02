/* tslint:disable */
/* eslint-disable */

export interface HospitalizationStay {
  id: string;
  reservationId?: string;
  patientId: string;
  patientName: string;
  department: string;
  roomNumber: string;
  bedNumber: string;
  from: Date;
  to: Date;
  status: StayStatusEnum;
  cancelReason?: string;
  notes?: string;
}

export type StayStatusEnum = 'planned' | 'active' | 'completed' | 'cancelled';

export function HospitalizationStayFromJSON(json: any): HospitalizationStay {
  return {
    id: json['id'],
    reservationId: json['reservationId'],
    patientId: json['patientId'],
    patientName: json['patientName'],
    department: json['department'],
    roomNumber: json['roomNumber'],
    bedNumber: json['bedNumber'],
    from: new Date(json['from']),
    to: new Date(json['to']),
    status: json['status'],
    cancelReason: json['cancelReason'],
    notes: json['notes'],
  };
}

export function HospitalizationStayToJSON(value?: HospitalizationStay | null): any {
  if (value === undefined || value === null) return undefined;
  return {
    id: value.id,
    reservationId: value.reservationId,
    patientId: value.patientId,
    patientName: value.patientName,
    department: value.department,
    roomNumber: value.roomNumber,
    bedNumber: value.bedNumber,
    from: value.from.toISOString(),
    to: value.to.toISOString(),
    status: value.status,
    cancelReason: value.cancelReason,
    notes: value.notes,
  };
}
