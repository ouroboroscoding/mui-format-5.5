/**
 * Format Hash
 *
 * Handles hashes (objects, maps) FormatOC nodes/parents
 *
 * @author Chris Nasr <chris@ouroboroscoding.com>
 * @copyright Ouroboros Coding Inc.
 * @created 2023-03-09
 */

// Ouroboros
import { combine, ucfirst } from '@ouroboros/tools';
import FormatOC from 'format-oc';

// NPM modules
import PropTypes from 'prop-types';
import React from 'react';

// Material UI
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// Components
import Child from './Child';

/**
 * Hash Node
 *
 * Handles array types with the ability to add / remove elements
 *
 * @name HashNode
 * @access public
 * @extends React.Component
 */
export default class HashNode extends React.Component {

	constructor(props) {

		// Call parent
		super(props);

		// Init Component ref
		this.component = null;

		// Get the react display properties
		let oReact = this.props.node.special('ui') || {}

		// If the title is not set
		if(!('title' in oReact)) {
			oReact.title = ucfirst(props.name);
		}

		// If the type is not set
		if(!('type' in oReact)) {
			throw new Error('Custom "type" must be set for Hash nodes as there is no standard implementation for them.');
		}

		// If there is no registered Component for the type
		if(!(oReact.type in HashNode._registered)) {
			throw new Error('No registered Component found for type: ' + oReact.type + '.');
		}

		// Init state
		this.state = {
			component: HashNode._registered[oReact.type],
			customProps: oReact.props || {},
			display: oReact
		}
	}

	// Called to set error(s)
	error(errors) {

		// Pass the errors to the Component
		this.component.error(errors);
	}

	render() {

		// Reset the ref
		this.component = null;

		// Store the name
		const ElName = this.state.component;

		// Combine the regular node props with any custom props
		const oProps = combine(this.state.customProps, {
			display: this.state.display,
			label: this.props.label,
			ref: el => this.component = el,
			name: this.props.name,
			node: this.props.node,
			nodeVariant: this.props.nodeVariant,
			onEnter: this.props.onEnter,
			placeholder: this.props.placeholder,
			value: this.props.value,
			validation: this.props.validation
		});

		// Render custom type
		return (
			<Box className="nodeHash">
				{this.state.display.title &&
					<Typography className="legend">{this.state.display.title}</Typography>
				}
				<ElName {...oProps} />
			</Box>
		);
	}

	// Called to validate
	valid() {

		// Pass the checking to the Component
		let bValid = this.props.node.valid(this.component.value);
		if(!bValid) {
			this.component.error(this.props.node.validation_failures);
		}
		return bValid;
	}

	// Called when value is request
	get value() {

		// Return the value of the Component
		return this.component.value;
	}

	// Called when new value is passed
	set value(val) {

		// Set the value of the Component
		this.component.value = val;
	}
}

/**
 * Register
 *
 * Static method for registering array types
 *
 * @name register
 * @access public
 * @param String type The type, or name, of the element to register
 * @param Class class_ The actual class to register under the type
 * @returns void
 */
HashNode._registered = {};
HashNode.register = (type, class_) => {
	HashNode._registered[type] = class_;
}

// Register the component
Child.register('HashNode', HashNode);

// Valid props
HashNode.propTypes = {
	label: PropTypes.oneOf(['above', 'none', 'placeholder']),
	name: PropTypes.string,
	node: PropTypes.instanceOf(FormatOC.Hash).isRequired,
	onEnter: PropTypes.func,
	placeholder: PropTypes.string,
	type: PropTypes.oneOf(['create', 'update']).isRequired,
	value: PropTypes.object,
	validation: PropTypes.bool
}

// Default props
HashNode.defaultProps = {
	label: 'placeholder',
	onEnter: () => {},
	name: '',
	value: {},
	validation: true
}
