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
  EmailVerified: { error?: string; authToken?: string } | undefined;
  SelectBuilding: undefined;
  SelectSlot: { buildingId: string; date?: string };
  BookingSuccess: { bookingId: string };
  Library: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  EmailVerify: { token?: string };
  VerifyEmail: { email: string };
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

export type MainTabParamList = {
  Home: undefined;
  Dashboard: undefined;
  Browse: undefined;
  BookRoom: undefined;
  Profile: undefined;
};

