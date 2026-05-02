/* tslint:disable */
/* eslint-disable */
import * as runtime from '../runtime';
import type { Reservation } from '../models';
import { ReservationFromJSON, ReservationToJSON } from '../models';

export interface GetReservationsRequest {
  departmentId: string;
}

export interface CreateReservationRequest {
  departmentId: string;
  reservation: Reservation;
}

export interface GetReservationRequest {
  departmentId: string;
  reservationId: string;
}

export interface UpdateReservationRequest {
  departmentId: string;
  reservationId: string;
  reservation: Reservation;
}

export interface DeleteReservationRequest {
  departmentId: string;
  reservationId: string;
}

export class ReservationsApi extends runtime.BaseAPI {

  async getReservationsRaw(requestParameters: GetReservationsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Array<Reservation>>> {
    const response = await this.request({
      path: `/medbed/${encodeURIComponent(requestParameters.departmentId)}/reservations`,
      method: 'GET',
      headers: {},
      query: {},
    }, initOverrides);
    return new runtime.JSONApiResponse(response, (jsonValue) => jsonValue.map(ReservationFromJSON));
  }

  async getReservations(requestParameters: GetReservationsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Array<Reservation>> {
    const response = await this.getReservationsRaw(requestParameters, initOverrides);
    return await response.value();
  }

  async createReservationRaw(requestParameters: CreateReservationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Reservation>> {
    const headerParameters: runtime.HTTPHeaders = {};
    headerParameters['Content-Type'] = 'application/json';
    const response = await this.request({
      path: `/medbed/${encodeURIComponent(requestParameters.departmentId)}/reservations`,
      method: 'POST',
      headers: headerParameters,
      query: {},
      body: ReservationToJSON(requestParameters.reservation),
    }, initOverrides);
    return new runtime.JSONApiResponse(response, (jsonValue) => ReservationFromJSON(jsonValue));
  }

  async createReservation(requestParameters: CreateReservationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Reservation> {
    const response = await this.createReservationRaw(requestParameters, initOverrides);
    return await response.value();
  }

  async getReservationRaw(requestParameters: GetReservationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Reservation>> {
    const response = await this.request({
      path: `/medbed/${encodeURIComponent(requestParameters.departmentId)}/reservations/${encodeURIComponent(requestParameters.reservationId)}`,
      method: 'GET',
      headers: {},
      query: {},
    }, initOverrides);
    return new runtime.JSONApiResponse(response, (jsonValue) => ReservationFromJSON(jsonValue));
  }

  async getReservation(requestParameters: GetReservationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Reservation> {
    const response = await this.getReservationRaw(requestParameters, initOverrides);
    return await response.value();
  }

  async updateReservationRaw(requestParameters: UpdateReservationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Reservation>> {
    const headerParameters: runtime.HTTPHeaders = {};
    headerParameters['Content-Type'] = 'application/json';
    const response = await this.request({
      path: `/medbed/${encodeURIComponent(requestParameters.departmentId)}/reservations/${encodeURIComponent(requestParameters.reservationId)}`,
      method: 'PUT',
      headers: headerParameters,
      query: {},
      body: ReservationToJSON(requestParameters.reservation),
    }, initOverrides);
    return new runtime.JSONApiResponse(response, (jsonValue) => ReservationFromJSON(jsonValue));
  }

  async updateReservation(requestParameters: UpdateReservationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Reservation> {
    const response = await this.updateReservationRaw(requestParameters, initOverrides);
    return await response.value();
  }

  async deleteReservationRaw(requestParameters: DeleteReservationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
    const response = await this.request({
      path: `/medbed/${encodeURIComponent(requestParameters.departmentId)}/reservations/${encodeURIComponent(requestParameters.reservationId)}`,
      method: 'DELETE',
      headers: {},
      query: {},
    }, initOverrides);
    return new runtime.VoidApiResponse(response);
  }

  async deleteReservation(requestParameters: DeleteReservationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
    await this.deleteReservationRaw(requestParameters, initOverrides);
  }
}
