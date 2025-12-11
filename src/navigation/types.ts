import { NavigatorScreenParams } from '@react-navigation/native';
import { MusicPack } from '../types';
import { CartItem } from '../store/cartStore';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  PackDetail: { packId: string };
  TrackPlayer: { packId: string; trackId: string };
  Checkout: { pack?: MusicPack; items?: CartItem[] };
  Cart: undefined;
  EditProfile: undefined;
  NotificationSettings: undefined;
  Chat: { mentorName: string; packTitle: string; packId: string };
  PaymentSuccess: { packId?: string; packIds?: string[] };
  EmailVerify: { token?: string };
  EmailVerified: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  EmailVerify: { token?: string };
  VerifyEmail: { email: string };
};

export type MainTabParamList = {
  Home: undefined;
  Dashboard: undefined;
  Browse: undefined;
  Library: undefined;
  Profile: undefined;
};

