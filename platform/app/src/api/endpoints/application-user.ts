import { AxiosRequestConfig } from 'axios'

export const datatable = (data: object): AxiosRequestConfig => {
	return {
		url: `/application-user/datatables`,
		method: 'POST',
    data
	}
}
