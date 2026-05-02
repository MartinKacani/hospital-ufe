/* tslint:disable */
/* eslint-disable */
import * as runtime from '../runtime';
import type { HospitalizationStay } from '../models';
import { HospitalizationStayFromJSON, HospitalizationStayToJSON } from '../models';

export interface GetStaysRequest {
  departmentId: string;
}

export interface CreateStayRequest {
  departmentId: string;
  stay: HospitalizationStay;
}

export interface GetStayRequest {
  departmentId: string;
  stayId: string;
}

export interface UpdateStayRequest {
  departmentId: string;
  stayId: string;
  stay: HospitalizationStay;
}

export interface DeleteStayRequest {
  departmentId: string;
  stayId: string;
}

export class StaysApi extends runtime.BaseAPI {

  async getStaysRaw(requestParameters: GetStaysRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Array<HospitalizationStay>>> {
    const response = await this.request({
      path: `/medbed/${encodeURIComponent(requestParameters.departmentId)}/stays`,
      method: 'GET',
      headers: {},
      query: {},
    }, initOverrides);
    return new runtime.JSONApiResponse(response, (jsonValue) => jsonValue.map(HospitalizationStayFromJSON));
  }

  async getStays(requestParameters: GetStaysRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Array<HospitalizationStay>> {
    const response = await this.getStaysRaw(requestParameters, initOverrides);
    return await response.value();
  }

  async createStayRaw(requestParameters: CreateStayRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<HospitalizationStay>> {
    const headerParameters: runtime.HTTPHeaders = {};
    headerParameters['Content-Type'] = 'application/json';
    const response = await this.request({
      path: `/medbed/${encodeURIComponent(requestParameters.departmentId)}/stays`,
      method: 'POST',
      headers: headerParameters,
      query: {},
      body: HospitalizationStayToJSON(requestParameters.stay),
    }, initOverrides);
    return new runtime.JSONApiResponse(response, (jsonValue) => HospitalizationStayFromJSON(jsonValue));
  }

  async createStay(requestParameters: CreateStayRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<HospitalizationStay> {
    const response = await this.createStayRaw(requestParameters, initOverrides);
    return await response.value();
  }

  async getStayRaw(requestParameters: GetStayRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<HospitalizationStay>> {
    const response = await this.request({
      path: `/medbed/${encodeURIComponent(requestParameters.departmentId)}/stays/${encodeURIComponent(requestParameters.stayId)}`,
      method: 'GET',
      headers: {},
      query: {},
    }, initOverrides);
    return new runtime.JSONApiResponse(response, (jsonValue) => HospitalizationStayFromJSON(jsonValue));
  }

  async getStay(requestParameters: GetStayRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<HospitalizationStay> {
    const response = await this.getStayRaw(requestParameters, initOverrides);
    return await response.value();
  }

  async updateStayRaw(requestParameters: UpdateStayRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<HospitalizationStay>> {
    const headerParameters: runtime.HTTPHeaders = {};
    headerParameters['Content-Type'] = 'application/json';
    const response = await this.request({
      path: `/medbed/${encodeURIComponent(requestParameters.departmentId)}/stays/${encodeURIComponent(requestParameters.stayId)}`,
      method: 'PUT',
      headers: headerParameters,
      query: {},
      body: HospitalizationStayToJSON(requestParameters.stay),
    }, initOverrides);
    return new runtime.JSONApiResponse(response, (jsonValue) => HospitalizationStayFromJSON(jsonValue));
  }

  async updateStay(requestParameters: UpdateStayRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<HospitalizationStay> {
    const response = await this.updateStayRaw(requestParameters, initOverrides);
    return await response.value();
  }

  async deleteStayRaw(requestParameters: DeleteStayRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
    const response = await this.request({
      path: `/medbed/${encodeURIComponent(requestParameters.departmentId)}/stays/${encodeURIComponent(requestParameters.stayId)}`,
      method: 'DELETE',
      headers: {},
      query: {},
    }, initOverrides);
    return new runtime.VoidApiResponse(response);
  }

  async deleteStay(requestParameters: DeleteStayRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
    await this.deleteStayRaw(requestParameters, initOverrides);
  }
}
