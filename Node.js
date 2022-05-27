/**
 * Format Node
 *
 * Handles a single FormatOC node
 *
 * @author Chris Nasr <chris@ouroboroscoding.com>
 * @copyright Ouroboros Coding Inc.
 * @created 2022-03-19
 */

// NPM modules
import FNode from 'format-oc/Node';
import PropTypes from 'prop-types';
import React from 'react';

// Material UI
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Dialog from '@mui/material/Dialog';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import Grid from '@mui/material/Grid';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// React Phone Input
import PhoneInput from 'react-phone-input-material-ui'

// Format modules
import Child from './Child';
import { SelectBase } from './Shared';

// Generic modules
import { isObject, ucfirst } from 'shared/generic/tools';

/**
 * Node
 *
 * Wrapper for all the different types of simple data
 *
 * @name Node
 * @access public
 * @extends React.Component
 */
export class Node extends React.Component {

	constructor(props) {

		// Call parent
		super(props);

		// Set initial state
		this.state = this.generateState();

		// Add the value
		this.state.value = props.value !== null ? props.value : this.state.display.default

		// Child elements
		this.el = null;
		this.search = null;
	}

	componentDidUpdate(prevProps) {

		// If the Node changed
		if(prevProps.node !== this.props.node) {
			this.setState(this.generateState());
		}
	}

	// Figure out the element type based on the default values of the node
	defaultType(node) {

		// If it has options, it's a select, no question
		if(node.options()) {
			return 'select';
		}

		// Get the node type
		let sType = node.type();

		// Figure it out by type
		switch(sType) {

			// If it's a string type at its core
			case 'any':
			case 'base64':
			case 'ip':
			case 'json':
			case 'md5':
			case 'string':
			case 'uuid':
			case 'uuid4':
				return 'text';

			// If it's a number
			case 'decimal':
			case 'float':
			case 'int':
			case 'timestamp':
			case 'uint':
				return 'number';

			// Else it's its own type
			case 'bool':
			case 'date':
			case 'datetime':
			case 'price':
			case 'time':
				return sType;

			default:
				throw new Error('invalid type in format/Node: ' + sType);
		}
	}

	error(msg) {
		this.el.error(msg);
	}

	generateState() {

		// Get the react display properties
		let oReact = this.props.node.special('react') || {}

		// If the title is not set
		if(!('title' in oReact)) {
			oReact.title = ucfirst(this.props.name);
		}

		// If there's no default
		if(!('default' in oReact)) {
			oReact.default = null;
		}

		// Return the new state
		return {
			display: oReact,
			type: 'type' in oReact ?
						oReact.type :
						this.defaultType(this.props.node),
		}
	}

	render() {

		// Get the component name based on the type
		let ElName = null;
		if(this.state.type in Node._registered) {
			ElName = Node._registered[this.state.type].class_;
		} else {
			throw new Error('invalid type in format/Node: ' + this.state.type);
		}

		// Get the value
		let mValue = this.state.value !== null ?
						this.state.value :
						Node._registered[this.state.type].default_;

		return (
			<React.Fragment>
				<ElName
					display={this.state.display}
					error={this.props.error}
					label={this.props.label}
					onChange={this.props.onChange}
					onEnter={this.props.onEnter || false}
					name={this.props.name}
					node={this.props.node}
					ref={el => this.el = el}
					value={mValue}
					validation={this.props.validation}
					variant={this.props.variant}
				/>
				{this.props.type === 'search' &&
					<SearchOption
						ref={el => this.search = el}
						type={this.state.type}
						variant={this.props.variant}
					/>
				}
			</React.Fragment>
		);
	}

	get value() {

		// Get the value of the element
		let mValue = this.el.value;

		// If the value is null
		if(mValue === null) {
			return null;
		}

		// If we're not in search mode, return the value as is
		if(this.props.type !== 'search') {
			return mValue;
		}

		// Get the value of the search select
		let sSearch = this.search.value;

		// If it's null or exact, return the value as is
		if(sSearch === null || sSearch === 'exact') {
			return mValue;
		}

		// Else, generate an object describing the search
		else {
			return {
				type: sSearch,
				value: this.el.value
			}
		}
	}

	set value(val) {

		// If we're not in search mode, set the value as is
		if(this.props.type !== 'search') {
			this.el.value = val;
			return;
		}

		// If we didn't get an object, assume exact
		if(!isObject(val)) {
			this.el.value = val;
			this.search.value = 'exact';
			return;
		}

		// Set the value and search dropdown
		this.el.value = val.value;
		this.search.value = val.type;
	}
}

/**
 * Register
 *
 * Static method for registering node types
 *
 * @name register
 * @access public
 * @param String type The type, or name, of the element to register
 * @param Class class_ The actual class to register under the type
 * @returns void
 */
Node._registered = {};
Node.register = (type, class_, default_='') => {
	Node._registered[type] = {
		class_: class_,
		defalt_: default_
	}
}

// Register the component with the Child generator
Child.register('Node', Node);

// Valid props
Node.propTypes = {
	error: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
	label: PropTypes.oneOf(['above', 'none', 'placeholder']),
	name: PropTypes.string.isRequired,
	node: PropTypes.instanceOf(FNode).isRequired,
	onChange: PropTypes.func,
	onEnter: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
	type: PropTypes.oneOf(['create', 'search', 'update']).isRequired,
	value: PropTypes.any,
	validation: PropTypes.bool,
	variant: PropTypes.oneOf(['filled', 'outlined', 'standard'])
}

// Default props
Node.defaultProps = {
	error: false,
	label: 'placeholder',
	onEnter: false,
	value: null,
	validation: true,
	variant: 'outlined'
}

/**
 * NodeBase
 *
 * Base class for all node types
 *
 * @name NodeBase
 * @access private
 * @extends React.Component
 */
export class NodeBase extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			error: false,
			value: props.value === undefined ? null : props.value
		}
		this.keyPressed = this.keyPressed.bind(this);
	}
	componentDidUpdate(prevProps) {
		if(prevProps.error !== this.props.error) {
			this.setState({error: this.props.error});
		}
	}
	error(msg) {
		this.setState({error: msg});
	}
	keyPressed(event) {
		if(event.key === 'Enter' && this.props.onEnter) {
			this.props.onEnter();
		}
	}
	get value() {
		return this.state.value === '' ? null : this.state.value;
	}
	set value(val) {
		let oState = {value: val};

		// Let anyone interested know
		if(this.props.onChange) {
			this.props.onChange(val);
		}

		// Make sure it's valid
		if(this.props.node.valid(val)) {
			oState.error = false;
		} else {
			oState.error = this.props.node.validation_failures[0][1]
		}

		// Set the state
		this.setState(oState);
	}
}

// Force props
NodeBase.propTypes = {
	display: PropTypes.object.isRequired,
	error: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
	name: PropTypes.string.isRequired,
	node: PropTypes.instanceOf(FNode).isRequired,
	onChange: PropTypes.func,
	onEnter: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
	value: PropTypes.any
}

/**
 * Node Bool
 *
 * Handles values of a true/false state
 *
 * @extends React.Component
 */
export class NodeBool extends NodeBase {

	constructor(props) {
		super(props);
		this.change = this.change.bind(this);
	}

	change(event) {
		// Impossible for this to be invalid, so just store it
		this.setState({
			error: false,
			value: event.target.checked
		});

		// If there's a callback
		if(this.props.onChange) {
			this.props.onChange(event.target.checked);
		}
	}

	render() {
		return (
			<Box className="center">
				<FormControlLabel
					className={'node_' + this.props.name}
					control={<Checkbox
								color="primary"
								checked={this.state.value ? true : false}
								onChange={this.change}
							/>}
					label={<span className={this.state.error !== false ? 'nodeBoolError' : 'false'}>{this.props.display.title}</span>}
				/>
			</Box>
		);
	}
}

// Register with Node
Node.register('bool', NodeBool);

/**
 * Node Date
 *
 * Handles values that represent a date
 *
 * @name NodeDate
 * @access public
 * @extends NodeBase
 */
export class NodeDate extends NodeBase {

	constructor(props) {
		super(props);
		this.change = this.change.bind(this);
	}

	change(event) {

		// Check the new value is valid
		let error = false;
		if(this.props.validation && !this.props.node.valid(event.target.value)) {
			error = 'Invalid Date';
		}

		// Update the state
		this.setState({
			error: error,
			value: event.target.value
		});

		// If there's a callback
		if(this.props.onChange) {
			this.props.onChange(event.target.value);
		}
	}

	render() {

		// Initial props
		let props = {
			className: 'node_' + this.props.name,
			error: this.state.error !== false,
			helperText: this.state.error,
			onKeyPress: this.keyPressed,
			onChange: this.change,
			type: 'date',
			value: this.state.value === null ? '' : this.state.value,
			variant: this.props.variant
		}

		// If the label is a placeholder, add additional props
		if(this.props.label === 'placeholder') {
			props.label = this.props.display.title;

		}

		// Render
		return (
			<React.Fragment>
				{this.props.label === 'above' &&
					<Typography>{this.props.display.title}</Typography>
				}
				<TextField {...props} />
			</React.Fragment>
		);
	}
}

// Register with Node
Node.register('data', NodeDate);

/**
 * Node Datetime
 *
 * Handles values that represent a date with a time
 *
 * @name NodeDatetime
 * @access public
 * @extends NodeBase
 */
export class NodeDatetime extends NodeBase {

	constructor(props) {
		super(props);
		this.change = this.change.bind(this);
	}

	change(event) {

		// Get the new value
		let newDatetime = event.target.value;

		// Remove the T and add the empty seconds
		newDatetime = newDatetime.replace('T', ' ') + ':00';

		// Check if it's valid
		let error = false;
		if(this.props.validation && !this.props.node.valid(newDatetime)) {
			error = 'Invalid Date/Time';
		}

		// Update the state
		this.setState({
			error: error,
			value: newDatetime
		});

		// If there's a callback
		if(this.props.onChange) {
			this.props.onChange(newDatetime);
		}
	}

	render() {

		// Initial props
		let props = {
			className: 'node_' + this.props.name,
			error: this.state.error !== false,
			helperText: this.state.error,
			onKeyPress: this.keyPressed,
			onChange: this.change,
			type: 'datetime-local',
			value: this.state.value === null ? '' : this.state.value.replace(' ', 'T'),
			variant: this.props.variant
		}

		// If the label is a placeholder, add additional props
		if(this.props.label === 'placeholder') {
			props.label = this.props.display.title;

		}

		// Render
		return (
			<React.Fragment>
				{this.props.label === 'above' &&
					<Typography>{this.props.display.title}</Typography>
				}
				<TextField {...props} />
			</React.Fragment>
		);
	}
}

// Register with Node
Node.register('datetime', NodeDatetime);

/**
 * Node Hidden
 *
 * Handles values that aren't visible
 *
 * @name NodeHidden
 * @access public
 * @extends NodeBase
 */
export class NodeHidden extends NodeBase {

	render() {
		let props = {}
		let minmax = this.props.node.minmax();
		if(minmax.minimum) {
			props.min = minmax.minimum;
		}
		if(minmax.maximum) {
			props.max = minmax.maximum;
		}

		return (
			<input
				type="hidden"
				value={this.state.value === null ? '' : this.state.value}
			/>
		);
	}
}

// Register with Node
Node.register('hidden', NodeHidden);

/**
 * Node Multi Select CSV
 *
 * Handles values that are actually a list of comma seperated values
 *
 * @name NodeMultiSelectCSV
 * @access public
 * @extends NodeBase
 */
export class NodeMultiSelectCSV extends NodeBase {

	constructor(props) {

		// Call parent
		super(props);

		// If we have display options
		let lDisplayOptions = props.display.options;

		// If we got data
		if(lDisplayOptions) {

			// If the options are a dynamic SelectBase
			if(lDisplayOptions instanceof SelectBase) {
				this.callback = this.dynamicData.bind(this);

				// Get default data and add callback
				lDisplayOptions = lDisplayOptions.track(this.callback);
			}
		}
		// Else, get the options from the node
		else {
			lDisplayOptions = this.props.node.options().map(s => [s, s]);
		}

		// Set the state options
		this.state.defaultValues = null;
		this.state.options = lDisplayOptions;

		// Refs
		this.checks = [];

		// Bind methods
		this.cancel = this.cancel.bind(this);
		this.click = this.click.bind(this);
		this.submit = this.submit.bind(this);
	}

	cancel(event) {
		this.setState({defaultValues: null});
	}

	click(event) {
		this.setState({
			defaultValues: this.state.value.split(
				this.props.display.extra_space ? ', ' : ','
			)
		});
	}

	dynamicData(data) {
		this.setState({options: data});
	}

	submit(event) {

		// Init the values
		let lValues = [];

		// Go through each ref
		for(let i in this.checks) {
			if(this.checks[i].checked) {
				lValues.push(this.checks[i].value);
			}
		}

		// Combine the values
		let sValue = lValues.join(
			this.props.display.extra_space ? ', ' : ','
		);

		// Check the new value is valid
		let error = false;
		if(this.props.validation && !this.props.node.valid(sValue)) {
			error = 'Invalid Value';
		}

		// Update the state
		this.setState({
			defaultValues: null,
			error: error,
			value: sValue
		});

		// If there's a callback
		if(this.props.onChange) {
			this.props.onChange(sValue);
		}
	}

	render() {

		// Clear refs
		this.checks = [];

		// Initial props
		let props = {
			className: 'node_' + this.props.name,
			error: this.state.error !== false,
			helperText: this.state.error,
			readOnly: true,
			type: 'text',
			value: this.state.value === null ? '' : this.state.value,
			variant: this.props.variant,
			inputProps: {
				onClick:this.click,
				style:{cursor: 'pointer'}
			}
		}

		// If the label is a placeholder, add additional props
		if(this.props.label === 'placeholder') {
			props.label= this.props.display.title;

		}

		return (
			<React.Fragment>
				{this.props.label === 'above' &&
					<Typography>{this.props.display.title}</Typography>
				}
				<TextField {...props} />
				{this.state.defaultValues !== null &&
					<Dialog
						maxWidth="lg"
						onClose={this.cancel}
						open={true}
					>
					<DialogTitle>{this.props.display.title}</DialogTitle>
					<DialogContent dividers>
						<Grid container spacing={2}>
							{this.state.options.map(o =>
								<Grid item xs={12} md={4} lg={2} key={o[0]}>
									<FormControlLabel
										control={<Checkbox
													color="primary"
													defaultChecked={this.state.defaultValues.includes(o[0]) ? true : false}
													inputRef={ref => this.checks.push(ref)}
													inputProps={{
														value: o[0]
													}}
												/>}
										label={o[1]}
									/>
								</Grid>
							)}
						</Grid>
					</DialogContent>
					<DialogActions>
						<Button variant="contained" color="primary" onClick={this.submit}>
							Submit
						</Button>
					</DialogActions>
				</Dialog>
				}
			</React.Fragment>
		);
	}

	set options(data) {
		this.setState({options: data});
	}
}

// Register with Node
Node.register('multiselectcsv', NodeMultiSelectCSV);

/**
 * Node Number
 *
 * Handles values that represent numbers (ints, floats, decimal)
 *
 * @name NodeNumber
 * @access public
 * @extends NodeBase
 */
export class NodeNumber extends NodeBase {

	constructor(props) {
		super(props);
		this.change = this.change.bind(this);
	}

	change(event) {

		// Check the new value is valid
		let error = false;
		if(this.props.validation &&
			!this.props.node.valid(event.target.value === '' ? null : event.target.value)) {
			error = 'Invalid Value';
		}

		// Update the state
		this.setState({
			error: error,
			value: event.target.value
		});

		// If there's a callback
		if(this.props.onChange) {
			this.props.onChange(event.target.value);
		}
	}

	render() {

		// Initial input props
		let inputProps = {};
		let minmax = this.props.node.minmax();
		if(minmax.minimum) {
			inputProps.min = minmax.minimum;
		}
		if(minmax.maximum) {
			inputProps.max = minmax.maximum;
		}

		// Initial props
		let props = {
			className: 'node_' + this.props.name,
			error: this.state.error !== false,
			helperText: this.state.error,
			onKeyPress: this.keyPressed,
			onChange: this.change,
			type: 'number',
			value: this.state.value === null ? '' : this.state.value,
			variant: this.props.variant,
			inputProps: inputProps
		}

		// If the label is a placeholder
		if(this.props.label === 'placeholder') {
			props.label = this.props.display.title;
			props.placeholder = this.props.display.placeholder;

		}

		// Render
		return (
			<React.Fragment>
				{this.props.label === 'above' &&
					<Typography>{this.props.display.title}</Typography>
				}
				<TextField {...props} />
			</React.Fragment>
		);
	}
}

// Register with Node
Node.register('number', NodeNumber);

/**
 * Node Password
 *
 * Handles values that are strings or string-like
 *
 * @name NodePassword
 * @access public
 * @extends NodeBase
 */
export class NodePassword extends NodeBase {

	constructor(props) {
		super(props);

		// If there's a regex, override the node
		if('regex' in props.display) {
			props.node.regex(props.display.regex);
		}

		this.change = this.change.bind(this);
	}

	change(event) {

		// Check the new value is valid
		let error = false;
		if(this.props.validation && !this.props.node.valid(event.target.value)) {
			error = 'Invalid Value';
		}

		// Update the state
		this.setState({
			error: error,
			value: event.target.value
		});

		// If there's a callback
		if(this.props.onChange) {
			this.props.onChange(event.target.value);
		}
	}

	render() {

		// Initial props
		let props = {
			className: 'node_' + this.props.name,
			error: this.state.error !== false,
			helperText: this.state.error,
			onKeyPress: this.keyPressed,
			onChange: this.change,
			type: 'password',
			value: this.state.value === null ? '' : this.state.value,
			variant: this.props.variant,
		}

		// If the label is a placeholder, add additional props
		if(this.props.label === 'placeholder') {
			props.label = this.props.display.title;
			props.placeholder = this.props.display.title;

		}

		// Render
		return (
			<React.Fragment>
				{this.props.label === 'above' &&
					<Typography>{this.props.display.title}</Typography>
				}
				<TextField {...props} />
			</React.Fragment>
		);
	}
}

// Register with Node
Node.register('password', NodePassword);

/**
 * Node Phone Number
 *
 * Handles values that are phone numbers
 *
 * @name NodePhoneNumber
 * @access public
 * @extends NodeBase
 */
export class NodePhoneNumber extends NodeBase {

	constructor(props) {
		super(props);
		this.change = this.change.bind(this);
	}

	change(value) {

		// Check the new value is valid
		let error = false;
		if(this.props.validation && !this.props.node.valid(value)) {
			error = 'Invalid Value';
		}

		// Update the state
		this.setState({
			error: error,
			value: value
		});

		// If there's a callback
		if(this.props.onChange) {
			this.props.onChange(value);
		}
	}

	render() {

		// Render
		return (
			<React.Fragment>
				{this.props.label === 'above' &&
					<Typography>{this.props.display.title}</Typography>
				}
				<FormControl className={'node_' + this.props.name} error={this.state.error !== false}>
					<PhoneInput
						component={TextField}
						label={this.props.display.title}
						onChange={this.change}
						onKeyPress={this.keyPressed}
						value={this.state.value === null ? '' : this.state.value}
						variant={this.props.variant}
					/>
					{this.state.error &&
						<FormHelperText>{this.state.error}</FormHelperText>
					}
				</FormControl>
			</React.Fragment>
		);
	}
}

// Register with Node
Node.register('phone_number', NodePhoneNumber);

/**
 * Node Price
 *
 * Handles values that represent numbers (ints, floats, decimal)
 *
 * @name NodePrice
 * @access public
 * @extends NodeBase
 */
export class NodePrice extends NodeBase {

	constructor(props) {
		super(props);
		this.change = this.change.bind(this);
	}

	change(event) {

		// Check the new value is valid
		let error = false;
		if(this.props.validation &&
			!this.props.node.valid(event.target.value === '' ? null : event.target.value)) {
			error = 'Invalid Value';
		}

		// Update the state
		this.setState({
			error: error,
			value: event.target.value
		});

		// If there's a callback
		if(this.props.onChange) {
			this.props.onChange(event.target.value);
		}
	}

	render() {

		// Initial input props
		let inputProps = {};
		let minmax = this.props.node.minmax();
		if(minmax.minimum) {
			inputProps.min = minmax.minimum;
		}
		if(minmax.maximum) {
			inputProps.max = minmax.maximum;
		}

		// Initial props
		let props = {
			className: 'node_' + this.props.name,
			error: this.state.error !== false,
			helperText: this.state.error,
			onKeyPress: this.keyPressed,
			onChange: this.change,
			type: 'number',
			value: this.state.value === null ? '' : this.state.value,
			variant: this.props.variant,
			inputProps: inputProps,
			InputProps: {
				startAdornment: <InputAdornment position="start">$</InputAdornment>,
			}
		}

		// If the label is a placeholder
		if(this.props.label === 'placeholder') {
			props.label = this.props.display.title;
			props.placeholder = this.props.display.placeholder;

		}

		// Render
		return (
			<React.Fragment>
				{this.props.label === 'above' &&
					<Typography>{this.props.display.title}</Typography>
				}
				<TextField {...props} />
			</React.Fragment>
		);
	}
}

// Register with Node
Node.register('price', NodePrice);

/**
 * Node Select
 *
 * Handles values that have specific options
 *
 * @name NodeSelect
 * @access public
 * @extends NodeBase
 */
export class NodeSelect extends NodeBase {

	constructor(props) {

		// Call parent
		super(props);

		// If we have display options
		let lDisplayOptions = props.display.options;

		// If we got data
		if(lDisplayOptions) {

			// If the options are a dynamic SelectBase
			if(lDisplayOptions instanceof SelectBase) {
				this.callback = this.dynamicData.bind(this);

				// Get default data and add callback
				lDisplayOptions = lDisplayOptions.track(this.callback);
			}

			// Else, if we have a list but the elements aren't lists
			else if(!(lDisplayOptions[0] instanceof Array)) {
				lDisplayOptions = lDisplayOptions.map(s => [s, s]);
			}
		}
		// Else, get the options from the node
		else {
			lDisplayOptions = this.props.node.options().map(s => [s, s]);
		}

		// Set the state options
		this.state.options = lDisplayOptions;

		// Bind methods
		this.change = this.change.bind(this);
	}

	componentWillUnmount() {
		// If there's a callback for dynamic options
		if(this.callback) {
			this.props.display.options.track(this.callback, true);
		}
	}

	dynamicData(data) {

		// Init the new state
		let oState = {options: data};

		// If the current value doesn't match the list
		if(data.indexOf(this.state.value) === -1) {
			oState.value = '';
		}

		// Set the new state
		this.setState(oState);
	}

	change(event) {

		// Check the new value is valid
		let error = false;
		if(this.props.validation &&
			!this.props.node.valid(event.target.value === '' ? null : event.target.value)) {
			error = 'Invalid Selection';
		}

		// Update the state
		this.setState({
			error: error,
			value: event.target.value
		});

		// If there's a callback
		if(this.props.onChange) {
			this.props.onChange(event.target.value);
		}
	}

	render() {

		// Init the option elements
		let lOpts = [<option key={0} value=''></option>];

		// Add the other options
		for(let i in this.state.options) {
			lOpts.push(<option key={1+i} value={this.state.options[i][0]}>{this.state.options[i][1]}</option>);
		}

		return (
			<React.Fragment>
				{this.props.label === 'above' &&
					<Typography>{this.props.display.title}</Typography>
				}
				<FormControl className={'node_' + this.props.name} error={this.state.error !== false} variant={this.props.variant}>
					{this.props.label === 'placeholder' &&
						<InputLabel id={this.props.name}>{this.props.display.title}</InputLabel>
					}
					<Select
						label={this.props.display.title}
						labelId={this.props.name}
						native
						onChange={this.change}
						value={this.state.value === null ? '' : this.state.value}
					>
						{lOpts}
					</Select>
					{this.state.error &&
						<FormHelperText>{this.state.error}</FormHelperText>
					}
				</FormControl>
			</React.Fragment>
		);
	}

	set options(data) {
		this.setState({options: data});
	}
}

// Register with Node
Node.register('select', NodeSelect);

/**
 * Node Text
 *
 * Handles values that are strings or string-like
 *
 * @name NodeText
 * @access public
 * @extends NodeBase
 */
export class NodeText extends NodeBase {

	constructor(props) {
		super(props);

		// If there's a regex, override the node
		if('regex' in props.display) {
			props.node.regex(props.display.regex);
		}

		this.change = this.change.bind(this);
	}

	change(event) {

		// Check the new value is valid
		let error = false;
		if(this.props.validation &&
			!this.props.node.valid(event.target.value === '' ? null : event.target.value)) {
			error = 'Invalid Value';
		}

		// Update the state
		this.setState({
			error: error,
			value: event.target.value
		});

		// If there's a callback
		if(this.props.onChange) {
			this.props.onChange(event.target.value);
		}
	}

	render() {

		// Initial inputProps
		let inputProps = {}
		let iDisplayMax = this.props.display.maximum;
		if(iDisplayMax) {
			inputProps.maxLength = iDisplayMax
		} else {
			let minmax = this.props.node.minmax();
			if(minmax.maximum) {
				inputProps.maxLength = minmax.maximum;
			}
		}

		// Initial props
		let props = {
			className: 'node_' + this.props.name,
			error: this.state.error !== false,
			helperText: this.state.error,
			onKeyPress: this.keyPressed,
			onChange: this.change,
			type: 'text',
			value: this.state.value === null ? '' : this.state.value,
			variant: this.props.variant,
			inputProps: inputProps
		}

		// If the label is a placeholder, add additional props
		if(this.props.label === 'placeholder') {
			props.label = this.props.display.title;
			props.placeholder = this.props.display.placeholder;

		}

		// Render
		return (
			<React.Fragment>
				{this.props.label === 'above' &&
					<Typography>{this.props.display.title}</Typography>
				}
				<TextField {...props} />
			</React.Fragment>
		);
	}
}

// Register with Node
Node.register('text', NodeText);

/**
 * Node TextArea
 *
 * Handles values that are strings or string-like over multiple lines
 *
 * @name NodeTextArea
 * @access public
 * @extends React.Component
 */
export class NodeTextArea extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			error: false,
			value: props.value
		}

		// If there's a regex, override the node
		if('regex' in props.display) {
			props.node.regex(props.display.regex);
		}

		this.change = this.change.bind(this);
	}

	change(event) {

		// Check the new value is valid
		let error = false;
		if(this.props.validation &&
			!this.props.node.valid(event.target.value === '' ? null : event.target.value)) {
			error = 'Invalid Value';
		}

		// Update the state
		this.setState({
			error: error,
			value: event.target.value
		});

		// If there's a callback
		if(this.props.onChange) {
			this.props.onChange(event.target.value);
		}
	}

	render() {

		// Initial props
		let props = {
			className: 'node_' + this.props.name,
			error: this.state.error !== false,
			helperText: this.state.error,
			onKeyPress: this.keyPressed,
			multiline: true,
			onChange: this.change,
			type: 'text',
			value: this.state.value === null ? '' : this.state.value,
			variant: this.props.variant
		}

		// If the label is a placeholder, add additional props
		if(this.props.label === 'placeholder') {
			props.label = this.props.display.title;
			props.placeholder = this.props.display.title;
		}

		// If there's a max, add it to props
		let minmax = this.props.node.minmax();
		if(minmax.maximum) {
			props.inputProps = {maxLength: minmax.maximum};
		}

		// Render
		return (
			<React.Fragment>
				{this.props.label === 'above' &&
					<Typography>{this.props.display.title}</Typography>
				}
				<TextField {...props} />
			</React.Fragment>
		);
	}

	error(msg) {
		this.setState({"error": msg});
	}

	get value() {
		return this.state.value === '' ? null : this.state.value;
	}

	set value(val) {
		this.setState({"value": val});
	}
}

// Register with Node
Node.register('textarea', NodeTextArea);

/**
 * Node Time
 *
 * Handles values that represent a time
 *
 * @name NodeTime
 * @access public
 * @extends NodeBase
 */
export class NodeTime extends NodeBase {

	constructor(props) {
		super(props);
		this.change = this.change.bind(this);
	}

	change(event) {

		// Check the new value is valid
		let newTime = event.target.value + ':00';
		let error = false;

		if(this.props.validation && !this.props.node.valid(newTime)) {
			error = 'Invalid Time';
		}

		// Update the state
		this.setState({
			error: error,
			value: newTime
		});

		// If there's a callback
		if(this.props.onChange) {
			this.props.onChange(newTime);
		}
	}

	render() {

		// Initial props
		let props = {
			error: this.state.error !== false,
			helperText: this.state.error,
			onKeyPress: this.keyPressed,
			onChange: this.change,
			type: 'time',
			value: this.state.value === null ? '' : this.state.value,
			variant: this.props.variant
		}

		// If the label is a placeholder, add additional props
		if(this.props.label === 'placeholder') {
			props.label = this.props.display.title;
		}

		// Render
		return (
			<React.Fragment>
				{this.props.label === 'above' &&
					<Typography>{this.props.display.title}</Typography>
				}
				<TextField {...props} />
			</React.Fragment>
		);
	}
}

// Register with Node
Node.register('time', NodeTime);

/**
 * Search Options
 *
 * Displays options for how to search the field based on the type
 *
 * @name SearchOption
 * @access private
 * @extends React.Component
 */
class SearchOption extends React.Component {

	// Constructor
	constructor(props) {

		// Call the parent
		super(props);

		// Init the type
		let lOpts = null;

		// Figure out the type of options based on the Node's type
		switch(props.type) {
			case 'hidden':
			case 'select':
			case 'multiselectcsv':
				break;

			case 'text':
			case 'textarea':
				lOpts = [
					<option key="exact" value="exact">Exact</option>,
					<option key="value" value="start">Starts with</option>,
					<option key="end" value="end">Ends with</option>,
					<option key="asterisk" value="asterisk">Uses *</option>
				];
				break;

			default:
				lOpts = [
					<option key="exact" value="exact">Exact</option>,
					<option key="greater" value="greater">Greater than (inclusive)</option>,
					<option key="less" value="less">Less than (inclusive)</option>
				];
				break;
		}

		// Init state
		this.state = {
			options: lOpts,
			value: lOpts ? 'exact': null
		};

		// Refs
		this.select = null;

		// Bind methods
		this.change = this.change.bind(this);
	}

	change(ev) {
		this.setState({value: ev.target.value});
	}

	// Render
	render() {
		if(this.state.options) {
			return (
				<Select
					className="selectSearchType"
					inputRef={el => this.select = el}
					native
					onChange={this.change}
					variant={this.props.variant}
					value={this.state.value === null ? '' : this.state.value}
				>
					{this.state.options}
				</Select>
			);
		} else {
			return(
				<div className="selectSearchEmpty">&nbsp;</div>
			);
		}
	}

	// Return the value of the select
	get value() {
		if(!this.state.options) {
			return 'exact';
		} else {
			return this.select.value;
		}
	}

	// Set the dropdown
	set value(val) {
		if(this.state.options) {
			this.setState({value: val});
		}
	}
}
