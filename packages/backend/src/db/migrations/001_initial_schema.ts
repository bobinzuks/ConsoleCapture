import { Knex } from 'knex';

/**
 * Initial database schema migration
 * Following SPARC principles for explicit schema definition
 */

export async function up(knex: Knex): Promise<void> {
  // Enable UUID extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // Enable TimescaleDB extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE');

  // ============= USERS TABLE =============
  await knex.schema.createTable('users', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255);
    table.string('name', 255).notNullable();
    table.enum('role', ['free', 'pro', 'team', 'enterprise', 'admin']).notNullable().defaultTo('free');
    table.uuid('organization_id').references('id').inTable('organizations').onDelete('SET NULL');
    table.string('avatar_url', 500);
    table.boolean('email_verified').notNullable().defaultTo(false);
    table.string('email_verification_token', 255);
    table.timestamp('email_verified_at');
    table.string('password_reset_token', 255);
    table.timestamp('password_reset_expires');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('last_login_at');
    table.string('last_login_ip', 45);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at');

    // Indexes
    table.index('email');
    table.index('organization_id');
    table.index('role');
    table.index('created_at');
  });

  // ============= ORGANIZATIONS TABLE =============
  await knex.schema.createTable('organizations', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 255).notNullable();
    table.string('slug', 100).notNullable().unique();
    table.uuid('owner_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('subscription_id').references('id').inTable('subscriptions').onDelete('SET NULL');
    table.jsonb('settings').notNullable().defaultTo('{}');
    table.string('logo_url', 500);
    table.string('custom_domain', 255);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at');

    // Indexes
    table.index('slug');
    table.index('owner_id');
  });

  // ============= SUBSCRIPTIONS TABLE =============
  await knex.schema.createTable('subscriptions', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    table.enum('tier', ['free', 'pro', 'team', 'enterprise']).notNullable();
    table.enum('status', ['active', 'canceled', 'past_due', 'trialing', 'unpaid']).notNullable();
    table.string('stripe_customer_id', 255).notNullable();
    table.string('stripe_subscription_id', 255);
    table.string('stripe_price_id', 255);
    table.timestamp('current_period_start').notNullable();
    table.timestamp('current_period_end').notNullable();
    table.boolean('cancel_at_period_end').notNullable().defaultTo(false);
    table.timestamp('trial_start');
    table.timestamp('trial_end');
    table.timestamp('canceled_at');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id');
    table.index('organization_id');
    table.index('stripe_customer_id');
    table.index('stripe_subscription_id');
    table.index('status');
  });

  // ============= SESSIONS TABLE (TimescaleDB Hypertable) =============
  await knex.schema.createTable('sessions', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    table.enum('status', ['active', 'paused', 'completed', 'aborted']).notNullable();
    table.timestamp('start_time').notNullable();
    table.timestamp('end_time');
    table.string('url', 2048);
    table.string('page_title', 500);
    table.integer('total_events').notNullable().defaultTo(0);
    table.integer('total_duration').notNullable().defaultTo(0);
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id');
    table.index('organization_id');
    table.index('status');
    table.index('start_time');
  });

  // Convert sessions to TimescaleDB hypertable
  await knex.raw(
    "SELECT create_hypertable('sessions', 'start_time', if_not_exists => TRUE, migrate_data => TRUE)"
  );

  // ============= RECORDINGS TABLE =============
  await knex.schema.createTable('recordings', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    table.uuid('session_id').notNullable().references('id').inTable('sessions').onDelete('CASCADE');
    table.string('title', 500).notNullable();
    table.text('description');
    table.enum('quality', ['720p', '1080p', '4k']).notNullable().defaultTo('1080p');
    table.enum('privacy', ['public', 'unlisted', 'private', 'password_protected']).notNullable().defaultTo('private');
    table.string('password_hash', 255);
    table.specificType('tags', 'text[]').defaultTo('{}');
    table.integer('duration').notNullable();
    table.bigInteger('file_size').notNullable();
    table.string('storage_url', 1000).notNullable();
    table.string('thumbnail_url', 1000);
    table.integer('view_count').notNullable().defaultTo(0);
    table.jsonb('metadata').notNullable().defaultTo('{}');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at');

    // Indexes
    table.index('user_id');
    table.index('organization_id');
    table.index('session_id');
    table.index('privacy');
    table.index('created_at');
    table.index('tags', undefined, 'gin');
  });

  // ============= CONSOLE_EVENTS TABLE (TimescaleDB Hypertable) =============
  await knex.schema.createTable('console_events', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('recording_id').notNullable().references('id').inTable('recordings').onDelete('CASCADE');
    table.uuid('session_id').notNullable().references('id').inTable('sessions').onDelete('CASCADE');
    table.timestamp('timestamp').notNullable();
    table.enum('type', ['log', 'warn', 'error', 'info', 'debug']).notNullable();
    table.text('message').notNullable();
    table.jsonb('args').defaultTo('[]');
    table.text('stack_trace');
    table.string('source', 1000);
    table.integer('line_number');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('recording_id');
    table.index('session_id');
    table.index('type');
    table.index('timestamp');
  });

  // Convert console_events to TimescaleDB hypertable
  await knex.raw(
    "SELECT create_hypertable('console_events', 'timestamp', if_not_exists => TRUE, migrate_data => TRUE)"
  );

  // ============= ANALYTICS_EVENTS TABLE (TimescaleDB Hypertable) =============
  await knex.schema.createTable('analytics_events', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('recording_id').notNullable().references('id').inTable('recordings').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('timestamp').notNullable();
    table.enum('event_type', ['view', 'play', 'pause', 'seek', 'complete', 'export', 'share', 'embed']).notNullable();
    table.integer('duration');
    table.integer('position');
    table.string('referrer', 2048);
    table.string('user_agent', 500);
    table.string('ip_address', 45);
    table.string('country', 100);
    table.string('city', 100);
    table.string('device_type', 50);
    table.jsonb('metadata').defaultTo('{}');

    // Indexes
    table.index('recording_id');
    table.index('user_id');
    table.index('event_type');
    table.index('timestamp');
  });

  // Convert analytics_events to TimescaleDB hypertable
  await knex.raw(
    "SELECT create_hypertable('analytics_events', 'timestamp', if_not_exists => TRUE, migrate_data => TRUE)"
  );

  // ============= API_KEYS TABLE =============
  await knex.schema.createTable('api_keys', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.string('key_hash', 255).notNullable().unique();
    table.string('key_preview', 20).notNullable();
    table.specificType('scopes', 'text[]').notNullable().defaultTo('{}');
    table.timestamp('last_used_at');
    table.timestamp('expires_at');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id');
    table.index('organization_id');
    table.index('key_hash');
  });

  // ============= WEBHOOKS TABLE =============
  await knex.schema.createTable('webhooks', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('organization_id').references('id').inTable('organizations').onDelete('CASCADE');
    table.string('url', 2048).notNullable();
    table.string('secret', 255).notNullable();
    table.specificType('events', 'text[]').notNullable().defaultTo('{}');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('last_triggered_at');
    table.integer('failure_count').notNullable().defaultTo(0);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id');
    table.index('organization_id');
    table.index('is_active');
  });

  // ============= TEAM_MEMBERS TABLE =============
  await knex.schema.createTable('team_members', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('role', ['owner', 'admin', 'member', 'viewer']).notNullable().defaultTo('member');
    table.timestamp('joined_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Unique constraint
    table.unique(['organization_id', 'user_id']);

    // Indexes
    table.index('organization_id');
    table.index('user_id');
  });

  // ============= AUDIT_LOGS TABLE (TimescaleDB Hypertable) =============
  await knex.schema.createTable('audit_logs', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('organization_id').references('id').inTable('organizations').onDelete('SET NULL');
    table.timestamp('timestamp').notNullable().defaultTo(knex.fn.now());
    table.string('action', 255).notNullable();
    table.string('resource_type', 100).notNullable();
    table.uuid('resource_id');
    table.string('ip_address', 45);
    table.string('user_agent', 500);
    table.jsonb('metadata').defaultTo('{}');

    // Indexes
    table.index('user_id');
    table.index('organization_id');
    table.index('action');
    table.index('resource_type');
    table.index('timestamp');
  });

  // Convert audit_logs to TimescaleDB hypertable
  await knex.raw(
    "SELECT create_hypertable('audit_logs', 'timestamp', if_not_exists => TRUE, migrate_data => TRUE)"
  );

  // Create updated_at trigger function
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Apply updated_at triggers to all tables
  const tables = ['users', 'organizations', 'subscriptions', 'sessions', 'recordings', 'api_keys', 'webhooks', 'team_members'];
  for (const tableName of tables) {
    await knex.raw(`
      CREATE TRIGGER update_${tableName}_updated_at
      BEFORE UPDATE ON ${tableName}
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
  }
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('team_members');
  await knex.schema.dropTableIfExists('webhooks');
  await knex.schema.dropTableIfExists('api_keys');
  await knex.schema.dropTableIfExists('analytics_events');
  await knex.schema.dropTableIfExists('console_events');
  await knex.schema.dropTableIfExists('recordings');
  await knex.schema.dropTableIfExists('sessions');
  await knex.schema.dropTableIfExists('subscriptions');
  await knex.schema.dropTableIfExists('organizations');
  await knex.schema.dropTableIfExists('users');

  // Drop function
  await knex.raw('DROP FUNCTION IF EXISTS update_updated_at_column CASCADE');
}
