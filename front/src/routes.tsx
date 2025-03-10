import { Navigate } from 'react-router-dom'
import MatrixByStressIndex from "./components/MatrixByStressIndex.tsx";
import BLE from "./components/BLE.tsx";

const routes = [
  {
    path: '/checkup',
    element: <BLE />,
  },
  {
    path: 'checkup-result/:stressIndex',
    element: <MatrixByStressIndex />,
  },
  {
    path: '*',
    element: <Navigate to='/checkup' />,
  }
]

export default routes