import { AppDataSource } from "./data-source"
import { User } from "./entity/User"
import {RollerCoaster} from "./entity/RollerCoaster";

import axios, { AxiosRequestConfig } from 'axios';
import  * as  cheerio  from 'cheerio';
import * as json2csv from 'json2csv';
import * as fs from 'fs';
import {parse} from "url";
import {Themepark} from "./entity/Themepark";


const axiosConfig = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36'
    }

}
AppDataSource.initialize().then(async () => {


    getThemeparks("1")
    // getCoasters("1") // North America
    // getCoasters("25852") // Europe
    // getCoasters("26777") //Africa
    // getCoasters("26371") //Asia
    // getCoasters("26371") //Australia
    // getCoasters("26723") //South America


}).catch(error => console.log(error))

async function getThemeparks(r: string) {
    const domain = 'https://rcdb.com';
    const region = 'r.htm?ol='+r+'&ot=3' // ot=3= Object type =Themeparks

    const axiosResponse = await axios.get(`${domain}/${region}`, axiosConfig);

    const $ = cheerio.load(axiosResponse.data)
    const totalThemeparks = parseInt($('.int').text())
    const totalpages = Math.ceil(totalThemeparks / 24);
    console.log(`total amusementParks: ${totalThemeparks} in ${totalpages} pages`);

    for(let page = 1; page < totalpages; page++) {
        const axiosPaginatedresponse = await axios.get(`${domain}/${region}&page=${page}`, axiosConfig)
        const paginates$ = cheerio.load(axiosPaginatedresponse.data);
        const rows = paginates$('.stdtbl tbody tr');

        for(let i = 0; i < rows.length; i++) {
            const row$ = cheerio.load(rows[i]);
            const link = row$('td:nth-of-type(2) a').attr('href')
            if(link) {
                const themepark = await getTPDetails(`${domain}${link}`);
                console.log('link', link, themepark)
                await AppDataSource.manager.save(Object.assign(themepark));
            }
        }
    }
}

async function getCoasters(r: string) {
    const domain = 'https://rcdb.com';
    const region = 'r.htm?ol='+r+'&ot=2'; // ot=2= Object type =Rollercoasters

    const axiosResponse = await axios.get(`${domain}/${region}`, axiosConfig);

    const $ = cheerio.load(axiosResponse.data);
    const totalRollerCoasters = parseInt($('.int').text());
    // Assume 24 per page
    const totalPages = Math.ceil(totalRollerCoasters / 24);

    console.log(`total rollerCoaster: ${totalRollerCoasters} in ${totalPages} pages`);

    for (let page = 1; page < totalPages; page++) {
        const axiosResponsePaginated = await axios.get(`${domain}/${region}&page=${page}`, axiosConfig);
        const paginated$ = cheerio.load(axiosResponsePaginated.data);
        const rows = paginated$('.stdtbl tbody tr');

        for (let i = 0; i < rows.length; i++) {
            const row$ = cheerio.load(rows[i]);
            const link = row$('td:nth-of-type(2) a').attr('href');

            if (link) {
                const rollerCoaster = await getRCDetails(`${domain}${link}`);
                console.log('link', link, rollerCoaster);
                await AppDataSource.manager.save(Object.assign(rollerCoaster))

            }

            await timeout(1000);
        }
    }


}
export async function getTPDetails(detailsLink: string) {
    const axiosResponse = await axios.get(detailsLink, axiosConfig);
    const $ = cheerio.load(axiosResponse.data);

    let tp: Themepark = new Themepark();
    console.log('name: ' + $('#feature h1').text())
    tp.name = $('#feature h1').text()
    tp.city= $('#feature > div > a:nth-of-type(1)').text();
    tp.state= $('#feature > div > a:nth-of-type(2)').text();
    tp.country= $('#feature > div > a:nth-of-type(3)').text();

    return Promise.resolve(tp);


}



export async function getRCDetails(detailsLink: string) {

    const axiosResponse = await axios.get(detailsLink, axiosConfig);

    const $ = cheerio.load(axiosResponse.data);

    let rc: RollerCoaster = new RollerCoaster();
        rc.name= $('#feature h1').text();
        rc.parkName= $('#feature > div > a:nth-of-type(1)').text();
        rc.city= $('#feature > div > a:nth-of-type(2)').text();
        rc.state= $('#feature > div > a:nth-of-type(3)').text();
        rc.country= $('#feature > div > a:nth-of-type(4)').text();
        rc.link= detailsLink;
        rc.make= $('#feature .scroll:nth-of-type(2) a:nth-of-type(1)').text();
        rc.model= $('#feature .scroll:nth-of-type(2) a:nth-of-type(2)').text();
        rc.type= $('#feature ul:nth-of-type(1) > li:nth-of-type(2) a:nth-of-type(1)').text();
        rc.design= $('#feature ul:nth-of-type(1) > li:nth-of-type(3) a:nth-of-type(1)').text(),
        rc.length= '';
        rc.height= '';
        rc.speed= '';
        rc.inversions= '';
        rc.verticalAngle= '';
        rc.duration= '';
        rc.gForce= '';
        rc.drop= '';


    const undesirableStats: string[] = ['arrangement', 'elements'];

    $('section:nth-of-type(2) .stat-tbl tr').toArray().map(element => {
        let header = $(element).find('th').text();
        header = camelize(header);
        if (header === 'inversions' || header == 'duration') {
            const span = $(element).find('td').text();
            if (!undesirableStats.includes(header)) {
                rc[header] = span;
            }

        }
        else {
            const span = $(element).find('span').text();
            if (!undesirableStats.includes(header)) {
                rc[header] = span;
            }
        }
    });

    const featuredHtml = $('#feature > p').html();
    const operatingInfoHtml$ = cheerio.load(`<div>${featuredHtml}</div>`);
    const operatingMess = operatingInfoHtml$('div').text();
    if (operatingMess.toLowerCase().includes('removed')) {
        rc.active = false;
        rc.started = operatingInfoHtml$('div time:nth-of-type(1)').attr('datetime');
        rc.ended = operatingInfoHtml$('div time:nth-of-type(2)').attr('datetime');
    }
    else {
        rc.active = true;
        rc.started = operatingInfoHtml$('div time:nth-of-type(1)').attr('datetime');
    }

    console.log('featured stuff', operatingInfoHtml$('div').text(), `<div>${featuredHtml.split('<br>')[2]}</div>`);

    const rows = $('#statTable tr');
    for (let i = 0; i < rows.length; i++) {
        const row$ = cheerio.load(rows[i]);
        if (row$('th').text().toLowerCase() === 'elements') {
            const elements = row$('td a');
            const elementsToPush: any[] = [];
            for (let elementIndex = 0; elementIndex < elements.length; elementIndex++) {
                elementsToPush.push(cheerio.load(elements[elementIndex])('a').text());
            }

            rc[row$('th').text().toLowerCase()] = elementsToPush.join(', ');
        }
        else {
            rc[row$('th').text().toLowerCase()] = row$('td').text();
        }

    }

    return Promise.resolve(rc);
}

function timeout(ms: number) {
    return new Promise(res => setTimeout(res, ms));
}

function camelize(str: string) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
}