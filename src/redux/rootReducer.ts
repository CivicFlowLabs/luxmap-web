import { combineReducers } from '@reduxjs/toolkit'
import authReducer from '../feature/auth/authSlice'
import workScheduleReducer from '../feature/work-schedule/workScheduleSlice'

const rootReducer = combineReducers({
    auth: authReducer,
    workSchedule: workScheduleReducer,
})

export type RootState = ReturnType<typeof rootReducer>
export default rootReducer