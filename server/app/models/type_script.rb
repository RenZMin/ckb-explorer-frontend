class TypeScript < ApplicationRecord
  belongs_to :cell_output
end

# == Schema Information
#
# Table name: type_scripts
#
#  id             :bigint(8)        not null, primary key
#  args           :binary
#  binary         :binary
#  reference      :binary
#  signed_args    :binary
#  version        :integer
#  cell_output_id :bigint(8)
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#
# Indexes
#
#  index_type_scripts_on_cell_output_id  (cell_output_id)
#