/* tslint:disable */
/* eslint-disable */
import * as runtime from '../runtime';
import type { Department } from '../models';
import { DepartmentFromJSON } from '../models';

export class DepartmentsApi extends runtime.BaseAPI {

  async getDepartmentsRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Array<Department>>> {
    const response = await this.request({
      path: `/medbed/departments`,
      method: 'GET',
      headers: {},
      query: {},
    }, initOverrides);
    return new runtime.JSONApiResponse(response, (jsonValue) => jsonValue.map(DepartmentFromJSON));
  }

  async getDepartments(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Array<Department>> {
    const response = await this.getDepartmentsRaw(initOverrides);
    return await response.value();
  }
}
