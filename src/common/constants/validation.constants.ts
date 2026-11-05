export const PASSWORD_REGEX =/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
export const PASSWORD_MESSAGE ='Password should have at least one special char, one number, one uppercase letter, one lowercase letter and between 8 -20 char length';

export const PHONE_REGEX = /^01[3-9]\d{8}$/;
export const PHONE_MESSAGE ='phone must be a valid Bangladesh mobile number such as 01712345678';
