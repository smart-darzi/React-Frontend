import { useContext } from 'react';
import { LocalStateContext } from './LocalStateContext';

export const useLocalState = () => useContext(LocalStateContext);
