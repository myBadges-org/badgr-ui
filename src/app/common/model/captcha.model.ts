export interface Payload {
	algorithm: string;
	challenge: string;
	number?: number;
	salt: string;
	signature: string;
	test?: boolean;
	took: number;
}
