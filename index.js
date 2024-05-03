var c = require( './dist' ).constants;
var Immutable = require( './dist' ).Immutable;

module.exports = {
    CLEAR_TAG: c.CLEAR_TAG,
    default: Immutable,
    DELETE_TAG: c.DELETE_TAG,
    GLOBAL_SELECTOR: c.GLOBAL_SELECTOR,
    Immutable: Immutable,
    MOVE_TAG: c.MOVE_TAG,
    NULL_SELECTOR: c.NULL_SELECTOR,
    PUSH_TAG: c.PUSH_TAG,
    REPLACE_TAG: c.REPLACE_TAG,
    SET_TAG: c.SET_TAG,
    SPLICE_TAG: c.SPLICE_TAG,
    Tag: require( './dist' ).Tag,
};
