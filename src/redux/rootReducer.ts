import { combineReducers } from '@reduxjs/toolkit'
import authReducer from '../feature/auth/authSlice'
import assetReducer from '../feature/assets/assetSlice'

const rootReducer = combineReducers({
    auth: authReducer,
    assets: assetReducer,
})

export type RootState = ReturnType<typeof rootReducer>
export default rootReducer