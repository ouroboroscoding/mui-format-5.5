/**
 * Format Array
 *
 * Handles arrays of FormatOC nodes/parents
 *
 * @author Chris Nasr <chris@ouroboroscoding.com>
 * @copyright Ouroboros Coding Inc.
 * @created 2022-03-19
 */

// NPM modules
import FormatOC from 'format-oc';
import PropTypes from 'prop-types';
import React from 'react';

// Material UI
import Box from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { green } from '@mui/material/colors';
import { red } from '@mui/material/colors';

// Components
import Child from './Child';

// Generic modules
import { afindi, clone, ucfirst, uuidv4 } from 'shared/generic/tools';

/**
 * Array Node
 *
 * Handles array types with the ability to add / remove elements
 *
 * @name ArrayNode
 * @access public
 * @extends React.Component
 */
export default class ArrayNode extends React.Component {

	constructor(props) {

		// Call parent
		super(props);

		// Store the child node
		this.child = this.props.node.child();

		// Init node refs
		this.nodes = {};

		// Get the react display properties
		let oReact = this.props.node.special('react') || {}

		// If the title is not set
		if(!('title' in oReact)) {
			oReact.title = ucfirst(props.name);
		}

		// The type
		let sType = 'type' in oReact ? oReact.type : null;

		// Init state
		this.state = {
			custom: sType && sType in ArrayNode._registered ? ArrayNode._registered[sType] : null,
			nodeClass: this.child.class(),
			display: oReact,
			elements: this.props.value.map(v => {
				return {
					value: v,
					key: uuidv4()
				}
			})
		}
	}

	// Called to add new array element
	add() {

		// Clone the current elements
		let lElements = clone(this.state.elements);

		// Add a new object
		lElements.push({
			value: null,
			key: uuidv4()
		})

		// Set the new state
		this.setState({elements: lElements});
	}

	error(errors) {

		// If we have a custom component
		if(this.state.custom) {
			this.nodes.error(errors);
		} else {
			console.error(errors);
		}
	}

	remove(key) {

		// Find the index
		let iIndex = afindi(this.state.elements, 'key', key);

		// If it's found
		if(iIndex > -1) {

			// Clone the current elements
			let lElements = clone(this.state.elements);

			// Remove the deleted index
			lElements.splice(iIndex, 1);
			this.nodes.splice(iIndex, 1);

			// Set the new state
			this.setState({elements: lElements});
		}
	}

	render() {

		// Reset the refs
		this.nodes = {};

		// If we have a custom component
		if(this.state.custom) {

			// Store the name
			let ElName = this.state.custom;

			// Render custom type
			return (
				<ElName
					display={this.state.display}
					label={this.props.label}
					ref={el => this.nodes = el}
					name={this.props.name}
					node={this.props.node}
					onEnter={this.props.onEnter}
					value={this.props.value}
					validation={this.props.validation}
				/>
			);
		}

		// Render
		return (
			<Box className="nodeArray">
				{this.state.display.title &&
					<Typography className="legend">{this.state.display.title}</Typography>
				}
				{this.state.elements.map(o =>
					<Box key={o.key} className="element">
						<Box className="data">
							{Child.create(this.state.nodeClass, {
								ref: el => this.nodes[o.key] = el,
								name: this.props.name,
								node: this.child,
								onEnter: this.props.onEnter,
								returnAll: true,
								type: this.props.type,
								value: o.value,
								validation: this.props.validation
							})}
						</Box>
						<Box className="action">
							<Tooltip title="Remove">
								<IconButton onClick={ev => this.remove(o.key)}>
									<i className="fas fa-minus-circle" style={{color: red[500]}} />
								</IconButton>
							</Tooltip>
						</Box>
					</Box>
				)}
				<Box className="element">
					<Box className="data">&nbsp;</Box>
					<Box className="action">
						<Tooltip title="Add">
							<IconButton onClick={ev => this.add()}>
								<i className="fas fa-plus-circle" style={{color: green[500]}} />
							</IconButton>
						</Tooltip>
					</Box>
				</Box>
			</Box>
		)
	}

	valid() {

		// If we have a custom component
		if(this.state.custom) {
			let bValid = this.props.node.valid(this.nodes.value);
			if(!bValid) {
				this.nodes.error(this.props.node.validation_failures);
			}
			return bValid;
		}

		// Valid?
		let bValid = true;

		// Get the list of nodes
		let lNodes = Object.values(this.nodes)

		// Go through each item and validate it
		for(let i in lNodes) {

			// Check if the current value is valid
			if(!this.child.valid(lNodes[i].value)) {
				lNodes[i].error(this.child.validation_failures[0][1]);
				bValid = false;
			}
		}

		// Return valid state
		return bValid;
	}

	// Called when value is request
	get value() {

		// If we have a custom component
		if(this.state.custom) {
			return this.nodes.value;
		}

		// Init the return value
		let lRet = [];

		// Get the list of nodes
		let lNodes = Object.values(this.nodes)

		// Go through all the fields used
		for(let i in lNodes) {

			// Get the new value
			lRet.push(lNodes[i].value);
		}

		// Return the values
		return lRet;
	}

	// Called when new value is passed
	set value(val) {

		// If we have a custom component
		if(this.state.custom) {
			this.nodes.value = val;
			return;
		}

		// Regenerate the state
		this.setState({
			elements: val.map(v => {
				return {
					value: v,
					key: uuidv4()
				}
			})
		});
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
ArrayNode._registered = {};
ArrayNode.register = (type, class_) => {
	ArrayNode._registered[type] = class_;
}

// Register the component
Child.register('ArrayNode', ArrayNode);

// Valid props
ArrayNode.propTypes = {
	label: PropTypes.oneOf(['above', 'none', 'placeholder']),
	name: PropTypes.string,
	node: PropTypes.instanceOf(FormatOC.Array).isRequired,
	onEnter: PropTypes.func,
	type: PropTypes.oneOf(['create', 'search', 'update']).isRequired,
	value: PropTypes.array,
	validation: PropTypes.bool
}

// Default props
ArrayNode.defaultProps = {
	label: 'placeholder',
	onEnter: () => {},
	name: '',
	value: [],
	validation: true
}
