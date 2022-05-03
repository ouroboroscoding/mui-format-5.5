/**
 * Child
 *
 * Used to simplify the process of children in children in children
 *
 * @author Chris Nasr <chris@ouroboroscoding.com>
 * @copyright Ouroboros Coding Inc.
 * @created 2022-03-19
 */

// NPM modules
import React from 'react';

// Generic modules
import { isObject } from 'shared/generic/tools';

// Private variables
const _components = {};

/**
 * Create
 *
 * Figure out the child node type necessary and create an instance of it
 *
 * @name create
 * @access public
 * @static
 * @param String name The name of the component to create
 * @param Object props Properties passed to the component
 * @returns React.Component
 */
function create(name, props) {

	// If the name is invalid
	if(!(name in _components)) {
		throw new Error('Child.create no component named "' + name + '"');
	}

	// If we didn't get an object for props
	if(!isObject(props)) {
		throw new Error('Child.create props must be an object');
	}

	// If value is null, remove it
	if(props.value === null) {
		delete props.value;
	}

	// Get the component
	let Component = _components[name];

	// Return
	return <Component {...props} />
}

/**
 * Register
 *
 * Registers the components that can be children because we can't require them
 * in this file as webpack can't handle file A that requires file B that
 * requires file A
 *
 * @name register
 * @access public
 * @static
 * @param String name The name of the class associated with the component
 * @param Class class_ The actual component
 * @returns void
 */
function register(name, component) {
	_components[name] = component;
}

// Default export
let Child = {
	create: create,
	register: register
}
export default Child;
