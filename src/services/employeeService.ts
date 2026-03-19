import api from "./api";
import type {
  Employee,
  EmployeeType,
  WorkUnit,
  PaginatedResponse,
} from "../types/employee";

export const employeeService = {
  async list(
    params?: Record<string, string | number>,
  ): Promise<{ data: PaginatedResponse<Employee> }> {
    const res = await api.get("/employees", { params });
    return res.data;
  },

  async show(id: number): Promise<{ data: Employee }> {
    const res = await api.get(`/employee/${id}`);
    return res.data;
  },

  async store(data: Partial<Employee>): Promise<{ data: Employee }> {
    const res = await api.post("/employee", data);
    return res.data;
  },

  async update(
    id: number,
    data: Partial<Employee>,
  ): Promise<{ data: Employee }> {
    const res = await api.patch(`/employee/${id}`, data);
    return res.data;
  },

  async destroy(id: number): Promise<void> {
    await api.delete(`/employee/${id}`);
  },
};

export const employeeTypeService = {
  async list(): Promise<EmployeeType[]> {
    const res = await api.get("/employee-types");
    return res.data.data || [];
  },
};

export const workUnitService = {
  async list(): Promise<WorkUnit[]> {
    const res = await api.get("/work-units");
    return res.data.data || [];
  },
};
