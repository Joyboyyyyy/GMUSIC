import { NavigatorScreenParams } from '@react-navigation/native';
import { MusicPack } from '../types';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  PackDetail: { packId: string };
  TrackPlayer: { packId: string; trackId: string };
  Checkout: { pack: MusicPack };
  EditProfile: undefined;
  NotificationSettings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Browse: undefined;
  Library: undefined;
  Profile: undefined;
};

