import 'react-native-gesture-handler';
// Initialize Firebase before App (and any screen/hook that imports `auth` from config).
import './src/services/firebase/config';

import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);
