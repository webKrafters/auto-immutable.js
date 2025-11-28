import { isString } from '../utils';

export function isReadonly( v : Record<string,{}> ) {
	if(
		Object.isFrozen( v ) ||
		isString( v ) ||
		!Object.keys( v ).length
	) {
		return true;
	}
	for( let k in v ) {
		if( !isReadonly( v[ k ] ) ) {
			return false;
		}
	}
	return true;
}
