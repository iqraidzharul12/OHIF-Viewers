import { render } from '@testing-library/react'
import { notification } from 'antd'
import { vi } from 'vitest'
import Notification from './index'

let mockRecoilValue: Record<string, object> | null = {
	open: { message: 'A notification' },
}
const mockNotification = vi.fn()
vi.mock('recoil', async (importOriginal) => {
    const mod = await importOriginal() as Record<string, unknown>
    return {
        ...mod,
        useRecoilValue: () => mockRecoilValue,
    }
})
vi.mock('antd', async (importOriginal) => {
    const mod = await importOriginal() as any
    return {
        ...mod,
        notification: {
            ...mod.notification,
            useNotification: () => [{
                open: (value: object) => mockNotification(value),
                error: (value: object) => mockNotification(value),
            } as typeof notification]
        }
    }
})

describe('Notification component', () => {
	it('shows notification', () => {
		render(<Notification />)
		expect(mockNotification).toBeCalledWith({
			key: 'updatable',
			message: 'A notification',
		})
	})
	it('shows empty notification', () => {
		mockRecoilValue = null
		render(<Notification />)
		expect(mockNotification).toBeCalledTimes(1)
	})
})
