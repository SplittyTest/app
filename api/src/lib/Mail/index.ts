import config from 'config';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import mailgunTransport from 'nodemailer-mailgun-transport';
import log from '@lib/Logger';
import fs from 'fs';
import path from 'path';
import { convert } from 'html-to-text';
import { compile } from 'handlebars';

// Create a test account or replace with real credentials.
const transport_config = config.get('email.transport') as mailgunTransport.Options;
const transporter = nodemailer.createTransport(mailgunTransport(transport_config));

export interface MailContact {
	name?: string;
	email: string;
}

export interface SendMailParams {
	to: string | string[] | MailContact[];
	from?: string | MailContact;
	reply_to?: string | MailContact;
	cc?: string | string[] | MailContact[];
	bcc?: string | string[] | MailContact[];
	subject: string;
	text?: string;
	html?: string;
	template?: string;
	data?: any;
}

// Change an array of contact objects to the proper format
function mapContacts(contacts: string | string[] | MailContact | MailContact[]): string | string[] {
	if (Array.isArray(contacts)) {
		if (typeof contacts[0] !== 'string') {
			return contacts.map((contact) => {
				// @ts-ignore
				return `${contact.name} <${contact.email}>`;
			});
		}
	} else {
		if (typeof contacts !== 'string') {
			return `${contacts.name} <${contacts.email}>`;
		}
	}
	// @ts-ignore
	return contacts;
}

// Extract a template from a file
async function extractTemplate(file_name: string) {
	try {
		const file_path = path.resolve(__dirname, 'templates', file_name + '.html');
		const html = await fs.readFileSync(file_path, 'utf-8');
		const text = convert(html);

		return {
			html,
			text,
		};
	} catch (err) {
		log.warn(
			{
				file_name,
			},
			'Unable to extract the email template from file',
			err,
		);
		return {
			html: '',
			text: '',
		};
	}
}

// Map data into a handlebars template
function mapData(template: string, data: any) {
	try {
		const compiledTemplate = compile(template);
		const mapped_template = compiledTemplate(data);
		return mapped_template;
	} catch (err) {
		log.warn('Unable to map data into email template', err);
		return '';
	}
}

// Send an email
async function send(params: SendMailParams) {
	// Map params
	const mapped_params: Mail.Options = {};
	mapped_params.to = mapContacts(params.to);

	if (params.from) {
		// @ts-ignore
		mapped_params.from = mapContacts(params.from);
	}
	if (params.cc) {
		// @ts-ignore
		mapped_params.cc = mapContacts(params.cc);
	}
	if (params.bcc) {
		// @ts-ignore
		mapped_params.bcc = mapContacts(params.bcc);
	}
	if (params.reply_to) {
		mapped_params.replyTo = mapContacts(params.reply_to);
	}
	mapped_params.subject = params.subject;

	// Extract a template
	if (params.template) {
		const { html, text } = await extractTemplate(params.template);
		mapped_params.html = html;
		mapped_params.text = text;
	}

	// Map the data
	if (params.data) {
		if (mapped_params.html) {
			mapped_params.html = mapData(mapped_params.html as string, params.data);
		}
		if (mapped_params.text) {
			mapped_params.text = mapData(mapped_params.text as string, params.data);
		}
	}

	try {
		await transporter.sendMail(mapped_params);
		log.info('Mail sent');
	} catch (err) {
		log.warn('Email not sent');
	}
	return true;
}

// We can build a more complex email library if we need to
export default {
	send,
};
