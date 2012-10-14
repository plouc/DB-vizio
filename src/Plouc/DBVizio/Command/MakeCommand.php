<?php

namespace Plouc\DBVizio\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Finder\Finder;
use Symfony\Component\Yaml\Yaml;
use PDO;

class MakeCommand extends Command
{
    /** @var array */
    protected $tables = array();

    /** @var array */
    protected $relations = array();

    public function configure()
    {
        $this->setName('dbvizio:make');
        $this->setDescription('generate the cdm');
    }

    /**
     * @param InputInterface $input
     * @param OutputInterface $output
     */
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        // load config file, no validation
        $config = Yaml::parse('./config.yml');

        // establish connection to mysql
        $pdo = new PDO(
            sprintf('mysql:host=%s;dbname=%s', $config['connection']['host'], 'information_schema'),
            $config['connection']['user'],
            $config['connection']['pwd'],
            array(
                PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8',
            )
        );

        // query db table columns
        $columnsStmt = $pdo->prepare('SELECT * FROM information_schema.columns AS c WHERE c.table_schema = :db ORDER BY table_name ASC, ordinal_position ASC');
        $columnsStmt->execute(array(
            ':db' => $config['db'],
        ));
        $columns = $columnsStmt->fetchAll(PDO::FETCH_ASSOC);

        $table = null;
        $tableName = null;
        foreach ($columns as $column) {
            if ($column['TABLE_NAME'] != $tableName) {
                if ($table != null) {
                    $this->tables[] = $table;
                }
                $tableName = $column['TABLE_NAME'];
                $table = array(
                    'name'   => $tableName,
                    'size'   => 12,
                    'fields' => array(),
                );
            }
            $table['fields'][] = array(
                'name' => $column['COLUMN_NAME'],
                'id'   => sprintf('%s.%s', $tableName, $column['COLUMN_NAME']),
                'type' => $column['COLUMN_TYPE'],
            );
        }
        $this->tables[] = $table;


        $keysStmt = $pdo->prepare('SELECT * FROM information_schema.key_column_usage AS kcu WHERE kcu.constraint_schema = :db AND kcu.referenced_table_name IS NOT NULL ORDER BY table_name');
        $keysStmt->execute(array(
            ':db' => $config['db'],
        ));
        $keys = $keysStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($keys as $key) {
            $this->relations[] = array(
                'source' => sprintf('%s.%s', $key['TABLE_NAME'],            $key['COLUMN_NAME']),
                'target' => sprintf('%s.%s', $key['REFERENCED_TABLE_NAME'], $key['REFERENCED_COLUMN_NAME']),
            );
        }

        $schema = array(
            'tables'    => $this->tables,
            'relations' => $this->relations
        );
        file_put_contents('./schema.json', json_encode($schema));
    }
}