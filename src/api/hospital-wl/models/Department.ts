/* tslint:disable */
/* eslint-disable */

export interface Department {
  id: string;
  name: string;
  code?: string;
}

export function DepartmentFromJSON(json: any): Department {
  return {
    id: json['id'],
    name: json['name'],
    code: json['code'],
  };
}
