/**
 * Results
 *
 * Handles generating results
 *
 * @author Chris Nasr <chris@ouroboroscoding.com>
 * @copyright Ouroboros Coding Inc.
 * @created 2022-03-19
 */

// Ouroboros
import { rest } from '@ouroboros/body';
import { clipboard } from '@ouroboros/browser';
import events from '@ouroboros/events';
import { iso, elapsed } from '@ouroboros/dates';
import { afindi, clone, omap, ucfirst } from '@ouroboros/tools';
import FormatOC from 'format-oc';

// NPM modules
import { createObjectCsvStringifier } from 'csv-writer-browser';
import Decimal from 'decimal.js';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Material UI
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Tooltip from '@mui/material/Tooltip';

// Components
import FormComponent from './Form';

// Format modules
import { SelectBase } from './Shared';

/**
 * Pagination Actions
 *
 * Handles adding the buttons and drop downs for pagination
 *
 * @name PaginationActions
 * @access private
 * @param Object props Properties passed to the component
 * @return React.Component
 */
function PaginationActions(props) {

	// Go to first page
	function first(event) {
		props.onPageChange(event, 0);
	}

	// Go to last page
	function last(event) {
		props.onPageChange(event, Math.max(0, Math.ceil(props.count / props.rowsPerPage) - 1));
	}

	// Go to next page
	function next(event) {
		props.onPageChange(event, props.page + 1);
	}

	// Go to previous page
	function prev(event) {
		props.onPageChange(event, props.page - 1);
	}

	// Render
	return (
		<div style={{flexShrink: 0}}>
			<IconButton
				onClick={first}
				disabled={props.page === 0}
				aria-label="First Page"
			>
				<i className="fa-solid fa-angle-double-left" />
			</IconButton>
			<IconButton
				onClick={prev}
				disabled={props.page === 0}
				aria-label="Previous Page"
			>
				<i className="fa-solid fa-angle-left" />
			</IconButton>
			<IconButton
				onClick={next}
				disabled={props.page >= Math.max(0, Math.ceil(props.count / props.rowsPerPage) - 1)}
				aria-label="Next Page"
			>
				<i className="fa-solid fa-angle-right" />
			</IconButton>
			<IconButton
				onClick={last}
				disabled={props.page >= Math.max(0, Math.ceil(props.count / props.rowsPerPage) - 1)}
				aria-label="Last Page"
			>
				<i className="fa-solid fa-angle-double-right" />
			</IconButton>
		</div>
	);
}

/**
 * Results Row
 *
 * Displays a single row of results
 *
 * @name ResultsRow
 * @access private
 * @param Object props Properties passed to the component
 * @return React.Component
 */
function ResultsRow(props) {

	// State
	let [actions, actionsSet] = useState({});
	let [menu, menuSet] = useState(false);
	let [update, updateSet] = useState(false);

	// Called when a customer action icon is clicked
	function action(index) {

		// If we have a callback
		if(props.actions[index].callback) {

			// Call it with the current data for the row
			props.actions[index].callback(props.data);
		}

		// Else, if we have a component
		else if(props.actions[index].component) {

			// Clone the current actions
			let oActions = clone(actions);

			// Get a string representation of the index
			let sIndex = index.toString();

			// Remove or add it to the actions
			if(actions[sIndex]) {
				delete oActions[sIndex];
			} else {
				oActions[sIndex] = props.actions[index].props || true;
			}

			// Set the new actions
			actionsSet(oActions);
		}
	}

	// Called to copy an ID to the clipboard
	function copyKey() {

		// Copy the primary key to the clipboard then notify the user
		clipboard.copy(props.data[props.info.primary]).then(b => {
			events.trigger('success', 'Record key copied to clipboard');
		});
	}

	// Called after a row is successfully editted
	function updateSuccess(values) {

		// Clone the data
		let ret = clone(props.data);

		// For each changed value
		for(let k in values) {
			ret[k] = values[k];
		}

		// Let the parent know
		if(typeof props.update === 'function') {
			props.update(ret);
		}

		// Turn off edit mode
		updateSet(false);
	}

	// Generate each cell based on type
	let lCells = [];
	for(let i in props.fields) {

		// Store field and value
		let sField = props.fields[i];
		let mValue = props.data[sField];

		// Init cell contents
		let mContent = null;

		// If we have a primary key and we can copy it
		if(props.info.copyPrimary && sField === props.info.primary) {
			mContent = (
				<Tooltip title="Copy Record Key">
					<IconButton onClick={copyKey}>
						<i className="fa-solid fa-key" />
					</IconButton>
				</Tooltip>
			);
		} else {

			// If we have a custom processor for the field
			if(sField in props.custom) {
				mContent = props.custom[sField](props.data);
			} else {

				// If the value is not undefined or null
				if(mValue !== undefined && mValue !== null) {

					// If we have a value and we have options
					if(props.options[sField]) {
						if(props.options[sField] === true) {
							mContent = 'Loading...';
						} else {
							if(props.info.types[sField] === 'multiselectcsv') {
								mContent = mValue.split(',').map(s => {
									return props.options[sField][s.trim()];
								}).join(', ');
							} else {
								mContent = props.options[sField][mValue];
							}
						}
					}

					// Else if the type is a bool
					else if(props.info.types[sField] === 'bool') {
						mContent = mValue === 1 ? 'True' : 'False';
					}

					// Else, if the type is a price
					else if(props.info.types[sField] === 'price') {
						mContent = `$${mValue}`;
					}

					// Else if the type is a timestamp
					else if(props.info.types[sField] === 'timestamp') {
						mContent = iso(mValue);
					}

					// If we have a string with newlines
					else if(typeof mValue === 'string' && mValue.includes('\n')) {
						mContent = mValue.split('\n').map((s,i) =>
							<p key={i}>{s}</p>
						);
					}

					// Else, set it as is
					else {
						mContent = mValue;
					}
				} else {
					mContent = '';
				}
			}
		}

		lCells.push(
			<TableCell key={i} className={'field_' + props.fields[i]}>
				{mContent}
			</TableCell>
		);
	}

	// Generate the actions cell
	lCells.push(
		<TableCell key={-1} className="actions" align="right">
			{props.actions.map((a, i) => {
				if(a.dynamic && typeof a.dynamic === 'function') {
					a = Object.assign(a, a.dynamic(props.data));
				}

				// If there's a url
				if(a.url) {
					return (
						<Link key={i} to={a.url}>
							<Tooltip key={i} title={a.tooltip}>
								<IconButton data-index={i} className="icon">
									<i className={a.icon + ' ' + (actions[i.toString()] ? 'open' : 'closed')} />
								</IconButton>
							</Tooltip>
						</Link>
					);
				}

				// Else, there should be a callback or component
				else {
					return (
						<Tooltip key={i} title={a.tooltip}>
							<IconButton data-index={i} className="icon" onClick={ev => action(ev.currentTarget.dataset.index)}>
								<i className={a.icon + ' ' + (actions[i.toString()] ? 'open' : 'closed')} />
							</IconButton>
						</Tooltip>
					);
				}
			})}
			{props.update &&
				<Tooltip title="Edit the record">
					<IconButton className="icon" onClick={ev => updateSet(b => !b)}>
						<i className={'fa-solid fa-edit ' + (update ? 'open' : 'closed')} />
					</IconButton>
				</Tooltip>
			}
			{props.remove &&
				<Tooltip title="Delete the record">
					<IconButton className="icon" onClick={() => props.remove(props.data[props.info.primary])}>
						<i className="fa-solid fa-trash-alt" />
					</IconButton>
				</Tooltip>
			}
			{props.menu.length > 0 &&
				<Tooltip title="More">
					<IconButton className="icon" onClick={ev => menuSet(b => b ? false : ev.currentTarget)}>
						<i className="fa-solid fa-ellipsis-vertical" />
					</IconButton>
				</Tooltip>
			}
			{menu !== false &&
				<Menu
					anchorEl={menu}
					open={true}
					onClose={ev => menuSet(false)}
				>
					{props.menu.map((o,i) =>
						<MenuItem key={i} onClick={ev => {
							menuSet(false);
							o.callback(props.data);
						}}>
							{o.icon &&
								<ListItemIcon>
									<i className={o.icon} />
								</ListItemIcon>
							}
							{o.title}
						</MenuItem>
					)}
				</Menu>
			}
		</TableCell>
	);

	return (
		<React.Fragment>
			<TableRow>
				{lCells}
			</TableRow>
			{update &&
				<TableRow>
					<TableCell colSpan={props.fields.length + 1}>
						<FormComponent
							cancel={() => updateSet(false)}
							errors={props.errors}
							gridSizes={props.gridSizes}
							gridSpacing={props.gridSpacing}
							noun={props.info.noun}
							service={props.info.service}
							success={updateSuccess}
							tree={props.info.tree}
							type="update"
							value={props.data}
						/>
					</TableCell>
				</TableRow>
			}
			{omap(actions, (b,i) =>
				<TableRow key={i} className="action_row">
					<TableCell colSpan={props.fields.length + 1}>
						{b === true ? React.createElement(props.actions[i].component, {
							onClose: () => action(i),
							value: props.data
						}) : React.createElement(props.actions[i].component, {
							onClose: () => action(i),
							value: props.data,
							...b
						})}
					</TableCell>
				</TableRow>
			)}
		</React.Fragment>
	);
}

// Valid props
ResultsRow.propTypes = {
	custom: PropTypes.object.isRequired,
	data: PropTypes.object.isRequired,
	errors: PropTypes.object.isRequired,
	fields: PropTypes.array.isRequired,
	gridSizes: PropTypes.objectOf(
		PropTypes.exact({
			xs: PropTypes.number,
			sm: PropTypes.number,
			md: PropTypes.number,
			lg: PropTypes.number,
			xl: PropTypes.number
		})
	),
	gridSpacing: PropTypes.number,
	info: PropTypes.object.isRequired,
	menu: PropTypes.array.isRequired,
	options: PropTypes.object.isRequired,
	remove: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]).isRequired,
	update: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]).isRequired
}

/**
 * Totals Row
 *
 * Displays a row of totals based on the results
 *
 * @name TotalsRow
 * @access private
 * @param Object props Properties passed to the component
 * @return React.Component
 */
function TotalsRow(props) {

	// Go through all the totals and generate the new values
	let oCells = {};
	for(let f of props.fields) {

		// If it's elapsed time
		if(['time_elapsed', 'time_average'].includes(props.info.types[f])) {
			oCells[f] = elapsed(props.totals[f]);
		}

		// Else the value stays as is
		else {
			oCells[f] = props.totals[f] || ''
		}
	}

	// Render
	return (
		<TableRow>
			{props.fields.map((f,i) =>
				<TableCell key={i} className={'total field_' + f}>
					{oCells[f]}
				</TableCell>
			)}
			<TableCell key={-1} className="total actions" align="right">
				&nbsp;
			</TableCell>
		</TableRow>
	);
}

// Valid props
TotalsRow.propTypes = {
	fields: PropTypes.array.isRequired,
	info: PropTypes.object.isRequired,
	totals: PropTypes.object.isRequired
}

/**
 * Results
 *
 * Handles displaying the table and pagination
 *
 * @name Results
 * @access public
 * @param Object props Properties passed to the component
 * @return React.Component
 */
export default class Results extends React.PureComponent {

	constructor(props) {

		// Call parent
		super(props);

		// Get the display options
		let oReact = props.tree.special('react') || {};

		// If there's no primary, assume '_id'
		if(!('primary' in oReact)) {
			oReact.primary = '_id';
		}

		// If there's no copyPrimary field, assume true
		if(!('copyPrimary' in oReact)) {
			oReact.copyPrimary = true;
		}

		// Set fields from either props, the react section, or from all nodes
		//	in the tree
		if(props.fields.length !== 0) {
			this.fields = props.fields;
		} else if('results' in oReact) {
			this.fields = oReact['results'];
		} else if('order' in oReact) {
			this.fields = oReact['order'];
		} else {
			this.fields = this.props.tree.keys();
		}

		// Generate the list of titles, types, and options
		this.titles = [];
		let oTypes = {};
		let oOptions = {};
		this.dynCallbacks = {};
		for(let k of this.fields) {

			// Get the react section
			let oNode = props.tree.get(k).special('react') || {};

			// Set the title
			this.titles.push({
				key: k,
				text: ('title' in oNode) ? oNode.title : ucfirst(k.replace(/_/g, ' '))
			});

			// Set the type
			oTypes[k] = oNode.type || props.tree.get(k).type()

			// If there's options
			if(oNode.options) {

				// If the options are a dynamic SelectBase
				if(oNode.options instanceof SelectBase) {
					oOptions[k] = true;
					this.dynCallbacks[k] = {
						sd: oNode.options,
						callback: this.optionCallback.bind(this, k)
					}
				} else {
					oOptions[k] = oNode.options.reduce((o, l) => Object.assign(o, {[l[0]]: l[1]}), {});
				}
			}
		}

		// Store rest info
		this.info = {
			copyPrimary: oReact.copyPrimary,
			noun: props.noun,
			primary: oReact.primary,
			service: props.service,
			tree: props.tree,
			types: oTypes
		}

		// Initial state
		this.state = {
			data: props.data,
			options: oOptions,
			order: props.order,
			orderBy: props.orderBy,
			page: 0,
			rowsPerPage: parseInt(localStorage.getItem('rowsPerPage')) || 10,
			totals: props.totals ? this.calculateTotals(oTypes, props.data) : {}
		}

		// Bind methods
		this.exportCsv = this.exportCsv.bind(this);
		this.orderChange = this.orderChange.bind(this);
		this.pageChange = this.pageChange.bind(this);
		this.perPageChange = this.perPageChange.bind(this);
		this.recordChanged = this.recordChanged.bind(this);
		this.recordRemoved = this.recordRemoved.bind(this);
	}

	componentDidMount() {
		let oOptions = {};
		for(let f in this.dynCallbacks) {
			oOptions[f] = this.dynCallbacks[f].sd.track(this.dynCallbacks[f].callback).reduce((o, l) => Object.assign(o, {[l[0]]: l[1]}), {});
		}
		this.setState({options: oOptions});
	}

	componentWillUnmount() {
		for(let f in this.dynCallbacks) {
			this.dynCallbacks[f].sd.track(this.dynCallbacks[f].callback, true);
		}
	}

	componentDidUpdate(prevProps) {
		if(prevProps.data !== this.props.data) {
			let oState = {data: this.props.data};
			if(this.props.totals) {
				oState.totals = this.calculateTotals(this.info.types, this.props.data);
			}
			this.setState(oState);
		}
	}

	calculateTotals(types, data) {

		// Init the totals, types, and count
		let oTotals = {};
		let oTypes = {};

		// If we have data
		if(data.length > 0) {

			// Go through each visible field
			for(let f of this.fields) {

				// If the field is numeric
				if(['int', 'uint', 'float', 'time_elapsed', 'time_average'].includes(types[f])) {
					oTotals[f] = 0;
					oTypes[f] = 'numeric';
				} else if(types[f] === 'decimal') {
					oTotals[f] = new Decimal('0.0');
					oTypes[f] = 'decimal';
				} else if(types[f] === 'price') {
					oTotals[f] = new Decimal('0.00');
					oTypes[f] = 'decimal';
				}
			}

			// Go through all the data
			for(let d of data) {

				// Go through each allowed type
				for(let f in oTypes) {

					// If the type is numeric
					if(oTypes[f] === 'numeric') {
						oTotals[f] += d[f] || 0;
					}

					// Else if it's decimal
					else if(oTypes[f] === 'decimal') {
						oTotals[f] = oTotals[f].plus(d[f] || 0)
					}
				}
			}

			// Go through the fields again to adjust based on some types
			for(let f of this.fields) {

				// If we have an average time
				if(types[f] === 'time_average') {
					oTotals[f] = ~~(oTotals[f]/data.length);
				}
			}
		}

		// Return the new totals
		return oTotals;
	}

	exportCsv() {

		// If there's no data, do nothing
		if(this.state.data.length === 0) {
			events.trigger('error', 'No data to export to CSV');
			return;
		}

		// Generate the header
		let lHeader = [];
		for(let k of Object.keys(this.state.data[0])) {
			lHeader.push({"id": k, "title": k});
		}

		// Create the CSV write instance
		let csvStringifier = createObjectCsvStringifier({
			"header": lHeader
		})

		// Generate the "file"
		let csv = 'data:text/csv;charset=utf-8,' + encodeURI(
			csvStringifier.getHeaderString() +
			csvStringifier.stringifyRecords(this.state.data)
		);

		// Generate a date to append to the filename
		let date = new Date();

		// Export by generating and clicking a fake link
		let link = document.createElement('a');
		link.setAttribute('href', csv);
		link.setAttribute('download', this.props.tree._name + '_' + date.toISOString() + '.csv');
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	optionCallback(field, options) {
		let oOptions = clone(this.state.options);
		oOptions[field] = options.reduce((o, l) => Object.assign(o, {[l[0]]: l[1]}), {});
		this.setState({options: oOptions});
	}

	orderChange(event) {

		// Save the new orderBy
		let orderBy = event.currentTarget.dataset.key;
		let order = '';

		// If it hasn't actually changed, switch it, else use the order we have
		if(orderBy === this.state.orderBy) {
			order = this.state.order === 'asc' ? 'desc' : 'asc';
		} else {
			order = this.state.order;
		}

		// Save the new state
		this.setState({
			data: this.sortData(clone(this.state.data), order, orderBy),
			order: order,
			orderBy: orderBy
		});
	}

	pageChange(event, page) {
		this.setState({"page": page})
	}

	perPageChange(event) {
		localStorage.setItem('rowsPerPage', event.target.value);
		this.setState({
			"rowsPerPage": parseInt(event.target.value),
			"page": 0
		});
	}

	render() {
		return (
			<TableContainer className="results">
				<Table stickyHeader aria-label="sticky table">
					<TableHead>
						<TableRow>
							{this.titles.map(title => (
								<TableCell
									key={title.key}
									sortDirection={this.state.orderBy === title.key ? this.state.order : false}
									className={'field_' + title.key}
								>
									<TableSortLabel
										active={this.state.orderBy === title.key}
										direction={this.state.orderBy === title.key ? this.state.order : 'asc'}
										data-key={title.key}
										onClick={this.orderChange}
									>
										{title.text}
									</TableSortLabel>
								</TableCell>
							))}
							<TableCell align="right" className="actions">
								<Tooltip title="Export CSV">
									<IconButton onClick={this.exportCsv}>
										<i className="fa-solid fa-file-csv" />
									</IconButton>
								</Tooltip>
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{(this.state.rowsPerPage > 0 ?
							this.state.data.slice(
								this.state.page * this.state.rowsPerPage,
								this.state.page * this.state.rowsPerPage + this.state.rowsPerPage
							) : this.state.data).map(row =>
							<ResultsRow
								actions={this.props.actions}
								custom={this.props.custom}
								data={row}
								errors={this.props.errors}
								fields={this.fields}
								gridSizes={this.props.gridSizes}
								gridSpacing={this.props.gridSpacing}
								info={this.info}
								key={row[this.info.primary]}
								menu={this.props.menu}
								options={this.state.options}
								remove={this.props.remove ? this.recordRemoved : false}
								types={this.state.types}
								update={this.props.update}
							/>
						)}
					</TableBody>
					<TableFooter>
						{this.props.totals &&
							<TotalsRow
								fields={this.fields}
								info={this.info}
								totals={this.state.totals || {}}
							/>
						}
						<TableRow>
							<TablePagination
								colSpan={this.titles.length + 1}
								count={this.state.data.length}
								onPageChange={this.pageChange}
								onRowsPerPageChange={this.perPageChange}
								page={this.state.page}
								rowsPerPage={this.state.rowsPerPage}
								rowsPerPageOptions={[10, 20, 50, { label: 'All', value: -1 }]}
								ActionsComponent={PaginationActions}
								SelectProps={{
									inputProps: { 'aria-label': 'rows per page' },
									native: true,
								}}
							/>
						</TableRow>
					</TableFooter>
				</Table>
			</TableContainer>
		);
	}

	recordChanged(record) {

		// Clone the state data
		let data = clone(this.state.data);

		// Find the index
		let iIndex = afindi(
			data,
			this.info.primary,
			record[this.info.primary]
		);

		// If found
		if(iIndex > -1) {

			// Update the data
			data[iIndex] = record;

			// Save the new state
			this.setState({"data": data}, () => {

				// Let the parent know if we have a callback
				if(typeof this.props.update === 'function') {
					this.props.update(record);
				}
			});
		}
	}

	recordRemoved(key) {

		// Send the key to the service via rest
		rest.delete(this.props.service, this.props.noun, {
			[this.info.primary]: key
		}).then(res => {

			// If there's an error
			if(res.error && !res._handled) {
				if(res.error.code in this.props.errors) {
					events.trigger('error', this.props.errors[res.error.code]);
				} else {
					events.trigger('error', res.error);
				}
			}

			// If there's a warning
			if(res.warning) {
				events.trigger('warning', res.warning);
			}

			// If there's data
			if(res.data) {

				// Let the parent know if we have a callback
				if(typeof this.props.remove === 'function') {
					this.props.remove(key);
				}
			}
		});
	}

	sortData(data, order, orderBy) {

		// Sort it based on the order and orderBy
		data.sort((a,b) => {

			// If the values are the same
			if(a[orderBy] === b[orderBy]) {
				return 0;
			} else {
				if(a[orderBy] > b[orderBy]) {
					return order === 'asc' ? 1: -1;
				} else {
					return order === 'asc' ? -1 : 1;
				}
			}
		});

		// Return the sorted data
		return data;
	}
}

// Valid props
Results.propTypes = {
	actions: PropTypes.array,
	custom: PropTypes.object,
	data: PropTypes.array.isRequired,
	errors: PropTypes.object,
	fields: PropTypes.array,
	gridSizes: PropTypes.objectOf(
		PropTypes.exact({
			xs: PropTypes.number,
			sm: PropTypes.number,
			md: PropTypes.number,
			lg: PropTypes.number,
			xl: PropTypes.number
		})
	),
	gridSpacing: PropTypes.number,
	menu: PropTypes.array,
	noun: PropTypes.string.isRequired,
	order: PropTypes.string,
	orderBy: PropTypes.string.isRequired,
	remove: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
	service: PropTypes.string.isRequired,
	totals: PropTypes.bool,
	tree: PropTypes.instanceOf(FormatOC.Tree).isRequired,
	update: PropTypes.oneOfType([PropTypes.func, PropTypes.bool])
}

// Default props
Results.defaultProps = {
	actions: [],
	custom: {},
	errors: {},
	fields: [],
	gridSizes: {__default__: {xs: 12, sm: 6, lg: 3}},
	gridSpacing: 2,
	menu: [],
	order: "asc",
	remove: false,
	totals: false,
	update: false
}
