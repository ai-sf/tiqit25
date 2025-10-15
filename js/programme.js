const fs = require('fs');
const yaml = require('js-yaml');
const { google } = require('googleapis');
// const { authenticate } = require('@google-cloud/local-auth');

async function main() {
    // const auth = await authenticate({
    //     keyfilePath: 'js/credentials.json',
    //     scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    // });

    const calendar = google.calendar({ version: 'v3'});

    const res = await calendar.events.list({
        calendarId: 'c2d52a68ae67c82a0299a4a678f9fef81d38b2387dc336716933f86b3afe6b56@group.calendar.google.com', 
        key: 'AIzaSyCum8F_nQNtcNCjq_AbbOZjIGDFZhBVAHs',
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime',
    });

    const events = res.data.items;
    // if (!events || events.length === 0) {
    //     console.log('No upcoming events found.');
    //     return;
    // }

    const scheduleMap = events.reduce((acc, event) => {
        const start = event.start.dateTime || event.start.date;
        const date = new Date(start).toLocaleDateString('en-GB').split('/').join('/');
        const hour = new Date(start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        const day = new Date(start).toLocaleDateString('en-US', { weekday: 'long' });

        if (!acc[date]) {
            acc[date] = {
                day: day,
                date: date,
                activity: []
            };
        }

        // Create location name, room and tag
        let locationName = 'TBD';
        let room = 'Room TBD';
        let tag = '';

        if (event.location && event.location.includes('-')) {
            [locationName, room] = event.location.split('-').map(part => part.trim());
            if (locationName == 'Povo 0' || locationName == 'Povo 1' || locationName == 'Povo 2') {
                tag = 'physunitn';
            } else if (locationName == 'IQOQI') {
                tag = 'iqoqi'
            }
        } else if (event.location) {
            locationName = event.location;
        }

        const activity = {
            hour: hour,
            name: event.summary,
            location: {
                name: locationName,
                room: room,
                tag: tag
            }
        };

        if (event.description) {
            activity.subactivities = [{ title: event.description }];
        }

        acc[date].activity.push(activity);

        return acc;
    }, {});

    const schedule = Object.values(scheduleMap);

    const fileContents = fs.readFileSync('_data/programme.yml', 'utf8');
    const data = yaml.load(fileContents);
    data.schedule = schedule;

    fs.writeFileSync('_data/programme.yml', yaml.dump(data, { lineWidth: -1 }));
    console.log('YAML file updated successfully.');
}

main().catch(console.error);