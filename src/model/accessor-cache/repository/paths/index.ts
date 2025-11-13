import dotize from '@webkrafters/path-dotize';
import { GLOBAL_SELECTOR } from '../../../../constants';

const SPLIT_PTN = /\./g;

export interface PathIdInfo {
	sanitizedPathId : number;
	sourcePathId : number;
};

export interface Tokenization {
	/**
	 * a list of IDs for user input object path strings that each 
	 * must result in the dot-notation object path to be used to
	 * acquiring the `tokens` property.
	 */
	sourceIds : Array<number>;
	/** tokenized version of a single dot-notated property path */
	sanitizedTokens : Array<string>;
};

class PathRepository {

	private _reuseSanitizedIds : Array<number> = [];
	private _maxSanitizedId = 0;

	private _reuseSourceIds : Array<number> = [];
	private _maxSourceId = 0;

	private _sanitizedToIdMap : Record<string, number> = {};
	private _sanitizedIdToTokenization : Record<number, Tokenization> = {}

	private _sourceToIdMap : Record<string, number> = {};
	private _sourceIdToSanitizedMap : Record<number, string> = {};

	getPathInfoAt( sourcePath : string ) : PathIdInfo {
		if( !( sourcePath in this._sourceToIdMap ) ) {
			return this._addNewSourcePath( sourcePath );
		}
		const sourcePathId = this._sourceToIdMap[ sourcePath ];
		return {
			sanitizedPathId: this._sanitizedToIdMap[
				this._sourceIdToSanitizedMap[ sourcePathId ]
			],
			sourcePathId
		};
	}

	getSanitizedPathOf( sourcePathId : number ) {
		return this._sourceIdToSanitizedMap[ sourcePathId ];
	}

	getIdOfSanitizedPath( sanitizedPath : string ) {
		return this._sanitizedToIdMap[ sanitizedPath ];
	}

	getPathTokensAt( sanitizedPathId : number ) {
		return this._sanitizedIdToTokenization[ sanitizedPathId ]?.sanitizedTokens;
	}

	getSourcePathAt( sourcePathId : number ) {
		const sIdMap = this._sourceToIdMap;
		for( let k in sIdMap ) {
			if( sIdMap[ k ] !== sourcePathId ) { continue }
			return k;
		}
	}

	removeSource( sourcePath : string ) {
		if( !( sourcePath in this._sourceToIdMap ) ) { return }
		const sourcePathId = this._sourceToIdMap[ sourcePath ];
		delete this._sourceToIdMap[ sourcePath ];
		this._reuseSourceIds.push( sourcePathId );
		const sanitized = this._sourceIdToSanitizedMap[ sourcePathId ];
		delete this._sourceIdToSanitizedMap[ sourcePathId ];
		const sanitizedPathId = this._sanitizedToIdMap[ sanitized ];
		const sIds = this._sanitizedIdToTokenization[ sanitizedPathId ].sourceIds;
		if( sIds.length === 1 ) {
			delete this._sanitizedToIdMap[ sanitized ];
			delete this._sanitizedIdToTokenization[ sanitizedPathId ];
			this._reuseSanitizedIds.push( sanitizedPathId );
			return;
		}
		this._sanitizedIdToTokenization[ sanitizedPathId ].sourceIds.splice(
			sIds.indexOf( sourcePathId ), 1
		);
	}

	removeSourceId( sourcePathId : number ) {
		sourcePathId in this._sourceIdToSanitizedMap &&
		this.removeSource( this.getSourcePathAt( sourcePathId ) );
	}

	private _addNewSourcePath( sourcePath : string )  : PathIdInfo {
		const sourcePathId = this._reuseSourceIds.pop() ?? ++this._maxSourceId;
		this._sourceToIdMap[ sourcePath ] = sourcePathId;
		let sanitized = sourcePath === GLOBAL_SELECTOR ? GLOBAL_SELECTOR : dotize( sourcePath );
		let sanitizedPathId : number = null;
		if( sanitized in this._sanitizedToIdMap ) {
			sanitizedPathId = this._sanitizedToIdMap[ sanitized ];
			this._sanitizedIdToTokenization[ sanitizedPathId ].sourceIds.push( sourcePathId );
			this._sourceIdToSanitizedMap[ sourcePathId ] = sanitized;
			return { sanitizedPathId, sourcePathId };
		}
		sanitizedPathId = this._reuseSanitizedIds.pop() ?? ++this._maxSanitizedId;
		this._sanitizedToIdMap[ sanitized ] = sanitizedPathId;
		this._sanitizedIdToTokenization[ sanitizedPathId ] = {
			sanitizedTokens: sanitized.split( SPLIT_PTN ),
			sourceIds: [ sourcePathId ]
		};
		this._sourceIdToSanitizedMap[ sourcePathId ] = sanitized;
		return { sanitizedPathId, sourcePathId };
	}

}

export default PathRepository;
