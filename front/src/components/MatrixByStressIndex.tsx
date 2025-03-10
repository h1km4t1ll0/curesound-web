import {FC, ReactNode, useMemo} from "react";
import {AudioPlayer} from "./AudioPlayer.tsx";
import {Link, useParams} from 'react-router-dom'


const MatrixByStressIndexWrapper: FC<{children: ReactNode, stressIndex: number, color: string}> = ({children, stressIndex, color}) =>  (
  <div>
    <h1>Fast CureSound checkup</h1>
    <h2>Your Stress Index is: <span style={{color,}}>{stressIndex}</span></h2>
    {children}
    <div>
      <button>
        <Link to={'/checkup'}>Back</Link>
      </button>
    </div>
  </div>
);

const MatrixByStressIndex: FC = () => {
  const {stressIndex: stressIndexFromParams} = useParams();
  console.log(stressIndexFromParams, 'stressIndexFromParams')

  const stressIndex = useMemo(() => {
    if (Number.isNaN(stressIndexFromParams)) {
      return -1;
    } else {
      return Number(stressIndexFromParams);
    }
  }, [stressIndexFromParams]);

  if (0 < stressIndex && stressIndex < 50) {
    return (
      <MatrixByStressIndexWrapper stressIndex={stressIndex} color={'#bd901c'}>
        <h3>Please listen to the activation matrix</h3>
        <AudioPlayer url={import.meta.env.VITE_ACTIVATION_MATRIX}/>
      </MatrixByStressIndexWrapper>
    );
  } else if (50 <= stressIndex && stressIndex <= 150) {
    return (
      <MatrixByStressIndexWrapper stressIndex={stressIndex} color={'#0c7e0e'}>
        <h3>Please listen to the balance matrix</h3>
        <AudioPlayer url={import.meta.env.VITE_BALANCE_MATRIX}/>
      </MatrixByStressIndexWrapper>
    );
  } else if (150 < stressIndex && stressIndex <= 500) {
    return (
      <MatrixByStressIndexWrapper stressIndex={stressIndex} color={'#bd901c'}>
        <h3>Please listen to the rest matrix</h3>
        <AudioPlayer url={import.meta.env.VITE_REST_MATRIX}/>
      </MatrixByStressIndexWrapper>
    );
  } else if (500 < stressIndex && stressIndex <= 900) {
    return (
      <MatrixByStressIndexWrapper stressIndex={stressIndex} color={'#a40909'}>
        <h3>Please listen to the rest matrix</h3>
        <AudioPlayer url={import.meta.env.VITE_REST_MATRIX}/>
      </MatrixByStressIndexWrapper>
    );
  } else {
    return (
      <MatrixByStressIndexWrapper stressIndex={stressIndex} color={''}>
        <h3>There is no suitable matrix for you :(</h3>
      </MatrixByStressIndexWrapper>
    );
  }
}

export default MatrixByStressIndex;