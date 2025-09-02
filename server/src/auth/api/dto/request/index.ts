export class CreateDoctorRequest {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  userId: number;
}
export class DoctorLoginRequest {
  phoneNumber: string;
  otp: string;
}

export class OtpRequest {
  phoneNumber: string;
}
