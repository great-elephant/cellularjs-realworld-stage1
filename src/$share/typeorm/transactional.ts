
import { Injectable } from '@cellularjs/di';
import { addServiceProviders, addServiceProxies, NextHandler, ServiceHandler } from '@cellularjs/net';
import { ReplicationMode } from 'typeorm';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { dataSourceStorage, DEFAULT_DATA_SOURCE } from './data-source';
import { QueryRunner } from './key.const';

export class TransactionOptions {
  replicationMode?: ReplicationMode;
  isolationLevel?: IsolationLevel;
}

export const Transactional = (options?: TransactionOptions) => aClass => {
  addServiceProxies(aClass, [TransactionalProxy]);
  addServiceProviders(aClass, [{
    token: TransactionOptions,
    useValue: options,
  }]);

  return aClass;
}

@Injectable()
class TransactionalProxy implements ServiceHandler {
  constructor(
    private nextHandler: NextHandler,
    private transactionOptions?: TransactionOptions,
  ) { }

  async handle() {
    const { transactionOptions, nextHandler } = this;

    const dataSource = dataSourceStorage.get(DEFAULT_DATA_SOURCE);
    const queryRunner = dataSource.createQueryRunner(transactionOptions?.replicationMode);

    try {
      await queryRunner.startTransaction(transactionOptions?.isolationLevel);

      const extModule = nextHandler.getExtModule();
      await extModule.addProvider({
        token: QueryRunner,
        useValue: queryRunner,
      });

      const rs = await nextHandler.handle();

      await queryRunner.commitTransaction();

      return rs;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;

    } finally {
      await queryRunner.release();
    }
  }
}
