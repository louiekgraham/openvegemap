import OH from 'opening_hours';

export default class openingHours {

    /**
     * Get the number of milliseconds in a day.
     * @returns {number}
     */
    static getDayInterval() {
        return 24 * 60 * 60 * 1000;
    }

    /**
     * Get the number of milliseconds in a week.
     * @returns {number}
     */
    static getWeekInterval() {
        return this.getDayInterval() * 7;
    }

    /**
     * Format an hour as HH:MM.
     * @param  {Date} date Date object
     * @return {string} Formatted date
     */
    static formatHour(date) {
        return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
    }

    /**
     * Return the weekday from a date.
     * @param  {Date} date Date object
     * @return {string} Formatted date
     */
    static formatDay(date) {
        return date.toLocaleDateString('en-US', {weekday: 'long'});
    }

    /**
     * Get a table row with closed days in the specified date interval.
     * @param  {Date} curDate  Current date in the loop
     * @param  {Date} prevDate Previous date in the loop
     * @return {string} Set of tr elements
     */
    static getClosedDates(curDate, prevDate) {
        let result = '';
        if (curDate - prevDate > this.getDayInterval()) {
            // If we advanced more than a day, it means we have to display one or more closed days
            let closedDate = prevDate;
            while (closedDate.getDay() < curDate.getDay()) {
                if (closedDate.getDay() === 1 || closedDate.getDay() > prevDate.getDay()) {
                    result += '<tr><th>' + this.formatDay(closedDate) + '</th><td colspan="2">Closed</td></tr>';
                }
                closedDate = new Date(closedDate.getTime() + this.getDayInterval());
            }
        }
        return result;
    }

    /**
     * Get opening hours in the specified date interval.
     * @param  {Object} oh          openingHours.js object
     * @param  {Date}   curDate     Current date in the loop
     * @param  {Date}   prevDate    Previous date in the loop
     * @param  {number} curDay      Current day in the loop
     * @param  {number} prevOpenDay Latest open day in the loop
     * @return {string} tr element
     */
    static getOpeningHoursRow(oh, curDate, prevDate, curDay, prevOpenDay) {
        let row = '';
        if (oh.getState(prevDate) && prevDate !== curDate) {
            row += '<tr><th>';
            if (prevOpenDay !== curDay) {
                row += this.formatDay(prevDate);
            }
            row += '</th><td>' + this.formatHour(prevDate) + '</td><td>' + this.formatHour(curDate) + '</td></tr>';
        }
        return row;
    }

    /**
     * Get a table containing opening hours.
     * @param  {string} value Value of the opening_hours tag
     * @return {string}       Set of tr elements
     */
    static getOpeningHoursTable(value) {
        const oh = new OH(value, null);
        const it = oh.getIterator();
        let table = '';

        // We use a fake date to start a monday
        let curDate = new Date(2017, 0, 2);
        let prevDate = curDate;
        let curDay;
        let prevOpenDay = new Date(2017, 0, 1).getDay();
        let endDate;

        it.setDate(curDate);
        endDate = new Date(curDate.getTime() + this.getWeekInterval());

        while (it.advance(endDate)) {
            curDate = it.getDate();
            curDay = prevDate.getDay();

            if (prevDate.getHours() !== 0 || prevDate.getMinutes() !== 0) {
                table += this.getOpeningHoursRow(oh, curDate, prevDate, curDay, prevOpenDay);
                table += this.getClosedDates(curDate, prevDate);

                if (oh.getState(prevDate) && prevOpenDay !== curDay) {
                    prevOpenDay = curDay;
                }
            }

            prevDate = curDate;
        }
        if (curDate.getDay() === 0) {
            // If the loop stopped on sunday, we might need to add another row
            it.advance();
            table += this.getOpeningHoursRow(oh, it.getDate(), curDate, prevDate.getDay(), prevOpenDay);
        } else {
            // If the loop stop before sunday, it means it is closed
            table += '<tr><th>Sunday</th><td colspan="2">Closed<td></tr>';
        }
        if (!table) {
            // Sometimes the opening hours data is in a format we don't support
            table += "<tr><th>Sorry, we don't have enough info</th></tr>";
        }
        return table;
    }
}