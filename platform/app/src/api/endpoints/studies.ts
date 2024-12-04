import { AxiosRequestConfig } from 'axios'

export const allStudies = (): AxiosRequestConfig => {
	return {
		url: `/studies/all`,
		method: 'GET'
	}
}

export const allSeriesByStudyId = (id: string): AxiosRequestConfig => {
	return {
		url: `/studies/${id}/series`,
		method: 'GET'
	}
}
