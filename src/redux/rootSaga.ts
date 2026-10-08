import { all, fork } from 'redux-saga/effects'
import authSaga from '../feature/auth/authSaga'
import assetSaga from '../feature/assets/assetSaga'
import adminUserSaga from '../feature/admin/adminUserSaga'

export default function* rootSaga() {
    yield all([
        fork(authSaga),
        fork(assetSaga),
        fork(adminUserSaga),
    ])
}