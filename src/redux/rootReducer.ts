import { combineReducers } from '@reduxjs/toolkit'
import authReducer from '../feature/auth/authSlice'
import assetReducer from '../feature/assets/assetSlice'
import workScheduleReducer from '../feature/work-schedule/workScheduleSlice'
import adminUserReducer from '../feature/admin/adminUserSlice'

const rootReducer = combineReducers({
    auth: authReducer,
    assets: assetReducer,
    workSchedule: workScheduleReducer,
    adminUsers: adminUserReducer,
})

export type RootState = ReturnType<typeof rootReducer>
export default rootReducer