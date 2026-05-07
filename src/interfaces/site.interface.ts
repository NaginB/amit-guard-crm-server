export interface ISite {
  _id?: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  contactPersonName?: string;
  contactPhoneNumber?: string;
  contactEmail?: string;
  siteType: string;
  description?: string;
  securityRequirements?: string;
  specialInstructions?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
